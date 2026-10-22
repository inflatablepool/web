#!/usr/bin/env python3
"""
05_ci_gate.py — 构建期闸门：不合格就让 CI 失败（防止 P0 问题复发）

在 Astro `npm run build` 之后、部署之前跑。检查 dist/ 里的产物，
所以不依赖线上环境，PR 阶段就能拦住问题。

检查项（全部可通过开关关闭，便于逐步收紧）：
  A. 语言一致性     <html lang> 与 title/H1/正文实际语种必须一致（治 ar/people 显示希腊语）
  B. 禁用字符       title/description/H1 中不得出现 "→"（治 em dash 误替换）
  C. 词数下限       进入 sitemap 的页面正文必须 ≥ MIN_WORDS（治空壳对比页）
  D. 通用标题       子页面不得沿用首页通用 title
  E. 标题模板       禁止 "Best Best"、机械 "Best " 前缀、title 等于 slug
  F. 内部页 noindex /internal/ /login/ /keystatic/ 必须 noindex
  G. sitemap 一致性 sitemap 中的每个 URL 必须在 dist 中存在且非 noindex 且 self-canonical
  H. 事实一致性     关键数字（国家数/型号数/slogan/电话）全站唯一（治 GEO 数据自相矛盾）

用法：
  python3 05_ci_gate.py --dist ./dist
  python3 05_ci_gate.py --dist ./dist --min-words 400 --skip H
  python3 05_ci_gate.py --dist ./dist --report ci-report.md

退出码：0 = 通过，1 = 有阻断级问题
"""

import argparse
import collections
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from langdetect_lite import is_mismatch  # noqa: E402

LOCALES = {"en", "fr", "de", "es", "pt", "it", "ar", "ru", "pl", "cs", "nl", "sv", "no", "el", "fi", "da"}

# 跨语言 canonical 折叠是本站设计（本地页 → EN 根），G 检查时两边都去语言前缀比较
STRIP_LOCALE = {"fr", "de", "es", "pt", "it", "ar", "ru", "pl", "cs", "nl", "sv", "no", "el", "fi", "da", "zh"}


def strip_locale(p):
    seg = p.strip("/").split("/")
    return ("/" + "/".join(seg[1:])).rstrip("/") or "/" if seg and seg[0] in STRIP_LOCALE else p.rstrip("/") or "/"

# 全站默认 title（config.yaml metadata.title.default），子页面沿用即 D 类事故
def _load_generic_title():
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (os.path.join(here, "..", "src", "config.yaml"), os.path.join(here, "src", "config.yaml")):
        if not os.path.isfile(cand):
            continue
        with open(cand, encoding="utf-8") as f:
            txt = f.read()
        m = re.search(r"^  title:\s*\n\s+default:\s*[\"']?([^\"'\n]+)", txt, re.M)
        if m:
            return m.group(1).strip()
        m = re.search(r"default:\s*[\"']?([^\"'\n]+)", txt)
        if m:
            return m.group(1).strip()
    return "Inflatable Pool Factory | RIB Boats, Inflatable Boats & SUP Boards Manufacturer \u2014 OEM/ODM"


GENERIC_TITLE = _load_generic_title()

INTERNAL_RE = re.compile(r"(?:^|/)(?:internal|login|keystatic|api)(?:/|$)")

TAG_STRIP = re.compile(r"<(script|style|nav|header|footer|template|noscript|svg)\b[^>]*>.*?</\1>", re.S | re.I)

# H. 事实一致性：每组正则在全站的匹配值必须唯一
# 服务国家数：排除分销商/个人履历/客户群语境（distributors in / partnerships across / centers in），避免误报
FACT_CHECKS = {
    "服务国家数": r"(?<!partnerships across )(?<!distributors in )(?<!centers in )(\d{2,3})\+?\s*(?:countries|Länder|pays|países|paesi|landen|länder|land|maita|χώρες|стран|krajach|بلد)",
    "型号数量": r"(?<!\()(\d{2,3})\s*(?:CE-certified\s+)?(?:models|Modelle|modèles|modelos|modelli|modellen)",
    "品牌 slogan": r"Engineering\s+(Reliable\s+Adventures|Freedom)\s+On\s+Water",
    "压测倍数": r"(1\.\d)\s*[x×]\s*(?:rated\s+)?(?:PSI|pressure)",
}


def locale_of(rel):
    seg = rel.strip("/").split("/")
    return seg[0] if seg and seg[0] in LOCALES and seg[0] != "en" else "en"


def main_text(html):
    body = html.split("</head>", 1)[-1]
    m = re.search(r"<main\b[^>]*>(.*?)</main>", body, re.S | re.I)
    chunk = TAG_STRIP.sub(" ", m.group(1) if m else body)
    chunk = re.sub(r"<!--.*?-->", " ", chunk, flags=re.S)
    return " ".join(re.sub(r"<[^>]+>", " ", chunk).split())


def attr(html, pat, default=""):
    m = re.search(pat, html, re.I | re.S)
    return m.group(1).strip() if m else default


def load_sitemap_paths(dist):
    """从 dist 中所有 sitemap*.xml 收集路径。"""
    paths = set()
    for f in glob.glob(os.path.join(dist, "**", "sitemap*.xml"), recursive=True):
        try:
            body = open(f, encoding="utf-8").read()
        except Exception:
            continue
        if "<sitemapindex" in body:
            continue
        for loc in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body):
            p = re.sub(r"^https?://[^/]+", "", loc)
            paths.add((p.rstrip("/") or "/"))
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", default="./dist")
    ap.add_argument("--min-words", type=int, default=400)
    ap.add_argument("--skip", default="", help="跳过的检查项字母，如 --skip CH")
    ap.add_argument("--report", default="")
    ap.add_argument("--warn-only", default="H", help="只告警不阻断的检查项")
    a = ap.parse_args()

    if not os.path.isdir(a.dist):
        sys.exit(f"dist 目录不存在：{a.dist}　请先 npm run build")

    skip, warn_only = set(a.skip.upper()), set(a.warn_only.upper())
    sitemap_paths = load_sitemap_paths(a.dist)
    print(f"sitemap 中路径：{len(sitemap_paths)}")

    errors, warnings = [], []
    titles = collections.defaultdict(list)
    facts = collections.defaultdict(set)
    trans_gap = []
    n_pages = 0

    for full in glob.glob(os.path.join(a.dist, "**", "*.html"), recursive=True):
        rel = "/" + os.path.relpath(full, a.dist).replace(os.sep, "/")
        rel = re.sub(r"/index\.html$", "/", rel)
        rel = re.sub(r"\.html$", "/", rel)
        path_key = rel.rstrip("/") or "/"
        try:
            html = open(full, encoding="utf-8").read()
        except Exception:
            continue
        n_pages += 1

        lang = attr(html, r"<html[^>]*\blang=[\"']([^\"']+)[\"']").split("-")[0].lower()
        title = re.sub(r"\s+", " ", attr(html, r"<title[^>]*>(.*?)</title>"))
        desc = attr(html, r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']')
        robots = attr(html, r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']*)["\']')
        canonical = attr(html, r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']*)["\']')
        h1s = [re.sub(r"<[^>]+>", " ", h).strip() for h in re.findall(r"<h1\b[^>]*>(.*?)</h1>", html, re.S | re.I)]
        text = main_text(html)
        words = len(text.split())
        noindex = "noindex" in robots.lower()
        expected = locale_of(rel)
        in_sitemap = path_key in sitemap_paths

        def err(code, msg):
            (warnings if code in warn_only else errors).append(f"[{code}] {rel} — {msg}")

        # A. 语言一致性（仅可索引页；noindex 旧页/降级语言页不做收录级检查）
        if "A" not in skip and words >= 30 and not noindex:
            if lang and lang != expected:
                err("A", f"<html lang=\"{lang}\"> 与 URL locale \"{expected}\" 不符")
            sample = " ".join([title, " ".join(h1s), text[:1200]])
            mism, det, conf = is_mismatch(expected, sample)
            if mism and det == "en" and expected != "en":
                # 背书语言（fr/de/es/it）页面正文仍是英文 = 内容翻译缺口。
                # 不阻断（存量普遍存在，阻断会让闸门失去信号价值），输出清单供内容工程排期；
                # 阻断项只保留结构错误（lang 属性不符 / 语言串台）。
                trans_gap.append(f"{rel}\t{expected}\t{title[:100]}")
                warnings.append(f"[X] {rel} — locale={expected} 内容仍是英文（未翻译），conf={conf}　title={title[:60]!r}")
            elif mism:
                err("A", f"locale={expected} 但实际语种为 {det}（语言串台），conf={conf}　title={title[:60]!r}")
            # 单独校验 title 与 H1：实测到 /ar/people/ 正文是阿拉伯语但 title 是希腊语，
            # 合并样本会被正文“稀释”而漏报，因此必须单独跑一道。
            for field, val in (("title", title), ("h1", " ".join(h1s))):
                if len(val.split()) >= 3:
                    m2, d2, c2 = is_mismatch(expected, val, min_conf=0.6)
                    if m2 and d2 == "en" and expected != "en":
                        trans_gap.append(f"{rel}\t{expected}\t{field}: {val[:100]}")
                        warnings.append(f"[X] {rel} — {field} 仍是英文（未翻译，conf={c2}）：{val[:70]!r}")
                    elif m2:
                        err("A", f"{field} 语种为 {d2} 但 locale={expected}（conf={c2}）：{val[:70]!r}")

        # B. 禁用字符
        if "B" not in skip:
            for name, val in (("title", title), ("description", desc), ("h1", " | ".join(h1s))):
                if "→" in val:
                    err("B", f"{name} 含误替换箭头 →：{val[:90]!r}")

        # C. 词数下限
        if "C" not in skip and in_sitemap and not noindex and words < a.min_words:
            err("C", f"正文仅 {words} 词（< {a.min_words}）但在 sitemap 中且可索引")

        # D. 通用标题（仅可索引页）
        if "D" not in skip and not noindex and path_key != "/" and title.startswith(GENERIC_TITLE) \
                and not re.fullmatch(r"/[a-z]{2}", path_key):
            err("D", f"沿用首页通用 title：{title[:70]!r}")

        # E. 标题模板事故（仅可索引页）
        if "E" not in skip and title and not noindex:
            if re.search(r"\bBest\s+Best\b", title, re.I):
                err("E", f'title 出现 "Best Best"：{title[:70]!r}')
            if re.match(r"^Best\s+(?:Understanding|How|What|Why|Which|When|Where|Who|Should|Can|Do|Does|Is|Are)\b", title):
                err("E", f'title 带机械 "Best " 前缀：{title[:70]!r}')
            slug = path_key.split("/")[-1]
            if slug and slug.islower() and len(slug) > 3 and title.lower() == slug.lower():
                err("E", f"title 就是 URL slug（未配置）：{title[:70]!r}")
            if len(title) > 65:
                warnings.append(f"[E] {rel} — title {len(title)} 字符，SERP 会截断")
            titles[title].append(rel)

        # F. 内部页必须 noindex
        if "F" not in skip and INTERNAL_RE.search(path_key) and not noindex:
            err("F", "内部页/登录页未加 noindex")
        if "F" not in skip and INTERNAL_RE.search(path_key) and in_sitemap:
            err("F", "内部页出现在 sitemap 中")

        # G. sitemap 一致性
        if "G" not in skip and in_sitemap:
            if noindex:
                err("G", "页面为 noindex 却在 sitemap 中")
            if words < 30:
                err("G", "空壳页（<30 词）在 sitemap 中，疑为 JS 软跳转，应改服务端 301")
            if canonical:
                cp = re.sub(r"^https?://[^/]+", "", canonical).rstrip("/") or "/"
                if strip_locale(cp) != strip_locale(path_key):
                    err("G", f"canonical 指向 {cp} 却仍在 sitemap 中")
            if not desc:
                err("G", "缺 meta description")
            if len(h1s) == 0:
                err("G", "缺 H1")
            elif len(h1s) > 1:
                warnings.append(f"[G] {rel} — {len(h1s)} 个 H1")

        # H. 事实一致性（仅英文页统计，避免翻译差异误报）
        if "H" not in skip and expected == "en":
            for name, pat in FACT_CHECKS.items():
                for m in re.finditer(pat, html, re.I):
                    facts[name].add(m.group(1) if m.groups() else m.group(0))

    # 重复标题
    if "E" not in skip:
        for t, paths in titles.items():
            same_page_diff_locale = len({locale_of(p) for p in paths}) == len(paths)
            if len(paths) > 1 and not same_page_diff_locale:
                errors.append(f"[E] 重复 title（{len(paths)} 个页面）：{t[:70]!r} → {paths[:4]}")
            elif len(paths) > 1:
                warnings.append(f"[E] 跨语言重复 title（可能未翻译）：{t[:60]!r} → {paths[:4]}")

    # 事实一致性
    if "H" not in skip:
        for name, vals in facts.items():
            if len(vals) > 1:
                msg = f"[H] 事实数据冲突「{name}」出现 {len(vals)} 个不同值：{sorted(vals)}"
                (warnings if "H" in warn_only else errors).append(msg)

    # 输出
    print(f"\n检查页面：{n_pages}")
    print(f"阻断级问题：{len(errors)}　告警：{len(warnings)}\n")
    by_code = collections.Counter(re.match(r"\[(\w)\]", e).group(1) for e in errors if re.match(r"\[(\w)\]", e))
    for code, n in sorted(by_code.items()):
        print(f"  [{code}] × {n}")
    print()
    for e in errors[:200]:
        print("  ✗", e)
    if len(errors) > 200:
        print(f"  …另 {len(errors)-200} 条，见 --report")
    for w in warnings[:60]:
        print("  !", w)

    if a.report:
        with open(a.report, "w", encoding="utf-8") as f:
            f.write(f"# CI 闸门报告\n\n页面 {n_pages}　阻断 {len(errors)}　告警 {len(warnings)}\n\n")
            f.write("## 阻断级\n\n" + "\n".join(f"- {e}" for e in errors) + "\n\n")
            f.write("## 告警\n\n" + "\n".join(f"- {w}" for w in warnings) + "\n")
            if trans_gap:
                f.write("\n## 翻译缺口（内容仍是英文，供内容工程排期）\n\n")
                f.write("页面路径\tlocale\t说明\n")
                for row in trans_gap:
                    f.write(row.replace("\t", "\t") + "\n")
        print(f"\n报告已写入 {a.report}（翻译缺口 {len(trans_gap)} 条）")

    if errors:
        print("\n❌ CI 闸门未通过。修复后重试，或用 --skip / --warn-only 暂时降级某项以便分批收紧。")
        return 1
    print("\n✅ CI 闸门通过。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
