# Inflatable Pool Factory 网站技术架构文档

> 最后更新: 2026-10-21 (P6 WebP 图片迁移: 15 张 >100KB 产品图转 WebP 1600px q82, 18.5MB→0.85MB; 蜜罐误伤修复: Contact.astro 页面 JS 提交前删除 email_confirm 字段, 事故复盘见 docs/technical-audit-2026-10.md §2.1; R2 自动 prune: fast-upload-r2.mjs 每次 deploy 自动清理本地已删除的 R2 对象; www→apex 301: Cloudflare Redirect Rule 单跳路径保留; 完整审计记录见 docs/technical-audit-2026-10.md)
> 项目路径: `D:\Github\Inflatable Pool Factory`
> 在线网址: https://inflatablepoolfactory.com (Cloudflare Pages + 5 Workers)
> 构建命令: `npm run build` → 输出到 `dist/` 目录
> 部署命令: `npx wrangler pages deploy dist/ --project-name inflatable-pool-factory`

---

## 目录

1. [技术栈](#1-技术栈)
2. [项目结构](#2-项目结构)
3. [构建流程](#3-构建流程)
4. [国际化 (i18n) 系统](#4-国际化-i18n-系统)
5. [产品页面系统](#5-产品页面系统)
6. [数据流与渲染管线](#6-数据流与渲染管线)
7. [Cloudflare Workers](#7-cloudflare-workers)
8. [Cloudflare Pages Functions](#8-cloudflare-pages-functions)
9. [R2 存储](#9-r2-存储)
10. [部署架构与限制](#10-部署架构与限制)
11. [常见错误及避免方法](#11-常见错误及避免方法)
12. [编辑指南与红线](#12-编辑指南与红线)
13. [附录: 关键文件引用](#13-附录-关键文件引用)
14. [后台管理系统架构](#14-后台管理系统架构)
15. [多语言批量编辑工具 (tools/)](#15-多语言批量编辑工具-tools)
16. [37 语言架构与上架流程](#16-37-语言架构与上架流程)
17. [图片处理 (WebP + 尺寸注册表)](#17-图片处理-webp--尺寸注册表)

---

## 1. 技术栈

| 层       | 技术                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| 框架     | **Astro 7.2** (v7.2.2, Rust 编译器), `output: 'static'`, Vite 8 (Rolldown)                                     |
| 语言     | TypeScript (v5.9.3)                                                                                            |
| 样式     | Tailwind CSS v4.3 + `@tailwindcss/vite` 插件 (postcss.config.js 已移除)                                        |
| 包管理   | npm (package-lock.json, CI 使用 `npm ci`)                                                                      |
| Node     | >= 22.12.0                                                                                                     |
| 主机     | **Cloudflare Pages** (静态文件) + **Cloudflare Workers** (API)                                                 |
| 数据库   | **Cloudflare D1** (`inflatable-pool-factory-db`: inquiry, news, rate_limit, better-auth 表)                    |
| 存储     | **Cloudflare R2** (inflatable-pool-factory-assets, inflatable-pool-factory-data)                               |
| CMS      | Keystatic (本地 CMS, 在 `/keystatic` 路由)                                                                     |
| 认证     | better-auth (Google OAuth + 邮箱密码, D1 会话, Turnstile)                                                      |
| 插件     | `@astrojs/sitemap`, `@astrojs/mdx`, `astro-icon`, `astro-seo`, `@astrojs/markdown-remark`, `astro-auto-import` |
| 产品数据 | `src/data/products.ts` (TypeScript 数组)                                                                       |
| 多语言   | 34 种语言, 自建 i18n 系统 (`src/i18n/`)                                                                        |

**注意**: 项目不使用 `@astrojs/cloudflare` 适配器, 而是构建为纯静态输出后部署到 Cloudflare Pages。Pages 自带的 Functions (`functions/_middleware.ts`) 处理语言重定向和 R2 资源跳转。

---

## 2. 项目结构

```
.
├── astro.config.ts          # Astro 配置 (output: 'static', 插件, alias)
├── package.json             # 脚本: dev/build/deploy/check
├── wrangler.toml            # 根 wrangler (仅声明 R2 bucket)
├── tsconfig.json
├── keystatic.config.ts      # Keystatic CMS 配置
├── src/
│   ├── config.yaml          # 主配置 (astrowind 主题)
│   ├── config.*.yaml        # 各语言覆盖配置 (zh, fr, de...)
│   ├── i18n/
│   │   ├── config.ts        # 语言列表, setLang() — 共享可变 _ui (不再直接使用)
│   │   ├── utils.ts         # getLangFromUrl, removeLang, localizePath
│   │   ├── page-content.ts  # getPageContent(lang, page) — 页面内容缓存
│   │   ├── data-registry.ts # 数据注册表 (产品/指南/内容)
│   │   └── generated/       # 构建期生成 (gitignored)
│   │       ├── ui-all.ts    # getUiForLang(lang) — 翻译入口
│   │       ├── ui/en.ts     # 英语翻译键值对 (自动生成)
│   │       ├── ui/{lang}.ts # 37 语言翻译 (39 个生成文件)
│   │       ├── pages/*.ts   # 每页一个模块 (~110 个, setPageContentData 注入)
│   │       ├── site-data.ts # site-* 键 (2.2 MiB, [lang]/ 页面直接 import)
│   │       ├── page-content.json # 全量载荷 (~6.8 MiB, 仅构建期用, 不进 public/)
│   │       └── i18n-config.json  # UI 文案 (同步一份到 public/data/)
│   ├── data/
│   │   ├── products.ts      # ProductRecord[] — 产品定义 (63 产品)
│   │   ├── product-business-data.ts  # 产品商业标签 (use_case, bestFor, ROI 数据)
│   │   ├── product-texts.ts # 产品多语言翻译文本
│   │   ├── content-v2.ts    # 内容 v2 记录 (含 business-guide 文章)
│   │   ├── knowledge-graph.ts # AI 知识图谱 (商业实体关系)
│   │   ├── world-map-data.ts   # 全球客户地图 (7 区域, 50+ 国家)
│   │   ├── factory-videos.ts   # 工厂视频数据 (8 阶段)
│   │   ├── faq.ts           # FAQ 数据
│   │   └── guides.ts        # 指南数据
│   ├── layouts/
│   │   ├── Layout.astro     # 主布局 (调用 setLang)
│   │   ├── PageLayout.astro # 页面布局
│   │   ├── ProductLayout.astro
│   │   └── ...
│   ├── pages/
│   │   ├── [lang]/          # 多语言路由 (37 语言, 降级语言 canonical 折叠, 全站 ~645 页面)
│   │   │   ├── index.astro       # 首页 (每种语言)
│   │   │   ├── products/
│   │   │   │   ├── index.astro   # 产品列表
│   │   │   │   ├── [slug].astro  # 产品详情
│   │   │   │   └── compare.astro # 产品对比
│   │   │   ├── industries/       # 行业 Landing Pages (2026)
│   │   │   │   ├── schools.astro      # SUP/皮划艇学校方案
│   │   │   │   └── distributors.astro # 经销商合作方案
│   │   │   ├── why-inflatable-pool-factory.astro # 品牌差异化 (3 支柱: commercial / idea-to-market / global)
│   │   │   ├── factory/
│   │   │   │   ├── index.astro       # 工厂总览
│   │   │   │   ├── capacity.astro    # 生产能力
│   │   │   │   ├── process.astro     # 生产流程
│   │   │   │   ├── quality-lab.astro # 质量实验室
│   │   │   │   ├── equipment.astro   # 设备与机械
│   │   │   │   └── oem-capability.astro # OEM/ODM 能力
│   │   │   └── ...
│   │   ├── products/        # 英语直连产品页面
│   │   │   ├── [slug].astro # 产品详情 (英语, 无语言前缀)
│   │   │   ├── index.astro
│   │   │   └── compare.astro
│   │   └── ...
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── Header.astro # 导航栏 (使用 getUiForLang)
│   │   │   └── Footer.astro # 页脚 (使用 getUiForLang)
│   │   └── ...
│   ├── middleware.ts        # Astro 中间件 (设置 locals.lang)
│   ├── content.config.ts    # Astro Content Collections 定义
│   └── utils/
│       └── products.ts      # 产品工具函数
├── workers/                 # Cloudflare Workers (5 个)
│   ├── admin-worker/        # better-auth 认证 + GitHub CRUD + D1 查询
│   ├── ai-worker/           # AI 问答/嵌入/向量检索 + 知识库重建 (Vectorize ai-index-v2)
│   ├── automation-worker/   # 每日 cron: D1 清理 + IndexNow + GEO 流水线
│   ├── contact-worker/      # 联系表单 (D1 + Turnstile + Resend)
│   ├── news-worker/         # D1 驱动的新闻/RSS/新闻 sitemap
│   └── shared/              # 共享代码 (auth.ts, schema.ts, client.ts, news-render.ts, assert-admin.ts)
├── migrations/              # D1 迁移 (0000 初始化, 0002 rate_limit 等)
├── functions/
│   └── _middleware.ts       # Cloudflare Pages Functions 中间件
├── scripts/                 # 构建/部署/工具脚本 (~60 个)
└── dist/                    # 构建输出 (静态文件)
```

---

## 3. 构建流程

`npm run build` 执行以下脚本:

```
node scripts/geo-build.mjs              # 1. 构建地理数据 + llms.txt (37 语言)
  && node scripts/generate-data-json.mjs # 2. 生成 i18n 构建数据 → src/i18n/generated/
     #    page-content.json (~6.8 MiB, 全量) + site-data.ts (2.2 MiB, 仅 site-* 键)
     #    content-v2* 键被排除 (由 src/data/content-v2.ts 直接读 YAML)
     #    page-content.json 绝不写入 public/ (Cloudflare Pages 单文件 ≥25 MiB 会被拒)
  && npx tsx scripts/generate-geo-files.ts # 3. 生成地理文件 (entity.json + llms-full.txt)
  && node scripts/_gen-uiall.cjs         # 4. 生成 ui-all.ts (合并 37 语言翻译)
  && node scripts/_gen-pages.cjs         # 5. 从 JSON 生成 pages/*.ts 模块 (~110 个)
  && node scripts/gen-icon-svgs.cjs      # 6. 生成图标 SVG
  && node scripts/generate-image-dimensions.mjs # 7. 解析全站图片宽高 (image-dimensions.json, CLS 修复)
  && astro build                         # 8. Astro 构建 (生成 ~645 页面)
  && node scripts/mirror-root-en.mjs     # 9. 镜像英文根级页面到 /en/
  && node scripts/generate-sitemaps.mjs  # 10. 生成各语言 sitemap
  && node scripts/generate-merchant-feed.mjs # 11. GMC 商品 Feed (门禁: MDX price×100==checkout unitAmount + 图片存在)
  && node scripts/validate-dist.mjs      # 12. dist 全量校验门禁 (死链/缺失图片/meta)
  && node scripts/fold-untranslated-canonical.mjs # 13. 降级语言 canonical 折叠到 EN
  && node scripts/clean-public-assets.mjs # 14. 清理公共资源
  && node scripts/generate-ai-corpus.mjs # 15. AI 知识语料 → dist/ai-corpus/*.json + manifest (ai-worker /api/reindex 消费)
```

构建结果: 约 **645 个页面** (37 语言; 降级语言 EN-fallback + canonical 折叠, 不复制整站), 输出到 `dist/` 目录。

**Astro 7 注意事项**:

- `compressHTML: true` 已在 `astro.config.ts` 显式设置 (Astro 7 默认 jsx 压缩)
- Rust 编译器严格模式: `.astro` 前端禁止顶层 `return` (如 `[category].astro` 的 redirect 分支需用无 return 写法), 内联 `<script>` 顶层 `return` 需包 IIFE
- `markdown.processor` 使用 `unified({ remarkPlugins, rehypePlugins })`
- npm 安装**无需** `--legacy-peer-deps` (astro-auto-import 0.5.2 起 peer 可干净解析)
- **lockfile 纪律**: CI 的 `npm ci` 要求 lock 与 registry 上 range 内**最新版本**一致 — 依赖发布新版本 (eslint/@typescript-eslint 等) 时 CI 会报 `EUSAGE: lock file's X does not satisfy X`, 需运行 `npm update` 后提交 lock (普通 `npm install` 不会 bump range 内版本)
- `package.json` overrides 锁定 `"vite": "^8"` + `"yaml": ">=2.8.3"`
- `scripts/patch-worker.mjs` (server 模式子域路由注入) 是**历史遗留**, 在 `output: 'static'` 下不执行, 不属构建管线

---

## 4. 国际化 (i18n) 系统

### 4.1 概述

网站支持 **37 种语言** (i18n-config.json):

- **16 种本地化语言** (含 en): 有完整翻译链 — en, fr, de, es, pt, ar (RTL), it, ru, pl, nl, sv, no, el, fi, da, ... (14 种非英语言 UI 键 ×1,721 完全对齐)
- **其余语言**: EN-fallback + `fold-untranslated-canonical.mjs` 将 canonical 折叠到 EN 根页 (避免翻译缺口被搜索引擎判为重复/薄内容)

```
en: English   fr: Français   de: Deutsch   es: Español
pt: Português  ar: العربية (RTL)  it: Italiano  ru: Русский
pl: Polski    nl: Nederlands  sv: Svenska   no: Norsk
el: Ελληνικά  fi: Suomi     da: Dansk
(完整 37 语言清单见 src/i18n/generated/i18n-config.json)
```

### 4.2 翻译数据链 (关键路径)

```
ui/*.ts (自动生成的翻译键值对文件)
  ↓
ui-all.ts (getUiForLang(lang) 函数)
  ↓
Header.astro / Footer.astro / 各页面
  (通过 getUiForLang(locale) 直接获取翻译)
```

**核心函数调用关系:**

1. **`getUiForLang(lang)`** (`src/i18n/generated/ui-all.ts:50`)
   - 从 15 个静态导入的语言模块 `ui/*.ts` 中查找
   - 返回: `(lang && map[lang]) || map.en || {}`
   - 这是**所有页面获取翻译的唯一正确入口**

2. **`setLang(lang)`** (`src/i18n/config.ts:38`)
   - 将指定语言的翻译数据**原地变异**到共享对象 `_ui` 上
   - 由 `Layout.astro:52` 调用
   - **⚠️ 存在竞态问题**: 由于 `_ui` 是模块级可变对象, 在 Astro 静态构建的并行渲染中 (`output: 'static'`, ~645 页面), 一个页面的 `setLang()` 可能覆盖另一个页面的数据

3. **`getPageContent(lang, page)`** (`src/i18n/page-content.ts:13`)
   - 从缓存中获取页面内容数据 (由构建脚本生成)
   - 用于页面级内容 (about, commercial-workboats 等)

4. **`getLangFromUrl(url)`** (`src/i18n/utils.ts:3`)
   - 从 URL 路径中提取语言代码

### 4.3 修正后的翻译获取方式

**✅ 正确方式 (所有已修复的页面):**

```ts
import { getUiForLang } from '~/i18n/generated/ui-all';
const t = (key: string) => getUiForLang(locale)?.[key] || key;
// 直接使用 getUiForLang, 不依赖共享 _ui 对象
```

**❌ 错误方式 (已全部替换):**

```ts
import { ui } from '~/i18n/config';
// 使用 (ui as any)[key] — 依赖共享可变对象, 会产生竞态
```

### 4.4 语言检测流程 (运行时)

1. Cloudflare Pages Functions `_middleware.ts` 处理请求:
   - 检测 URL 是否有语言前缀
   - 如果没有, 通过 cookie → cf-ipcountry → Accept-Language 检测语言
   - 非英语用户重定向到对应语言 (302)
   - 英语 `/en/` 重定向到 `/` (308)
2. Astro 中间件 `src/middleware.ts` 设置 `context.locals.lang`
3. 布局 `Layout.astro` 调用 `setLang(currentLang)` 设置 UI 数据

### 4.5 导航翻译系统 (navTextMap + i18n-config.json + routing.ts)

导航的翻译与其他内容不同：系统**只加载英文** `navigation.yaml`，然后通过 `t()` 函数实时翻译。

**渲染流程:**

```
navigation.yaml (英文 text 值)
  ↓
Header.astro / Footer.astro 的 t() 函数
  ↓
navTextMap: 将英文 text 映射到翻译键 (如 "Buyer Center" → "nav.buyerCenter")
  ↓
i18n-config.json: 将翻译键映射到各语言文本 (如 "nav.buyerCenter" → "买家中心")
  ↓
localizeHref() (src/i18n/routing.ts): 匹配 LOCALIZED_ROUTES → 添加 /{lang} 前缀
  ↓
显示翻译后的文本
```

**共享路由模块** `src/i18n/routing.ts`:

- 原本 `LOCALIZED_ROUTES` 在 Header.astro 和 Footer.astro 中各定义一份（~200 行重复）
- 现已提取到共享模块，两个组件各减少 101 行
- 提供 `localizeHref()`、`entityForHref()` 等工具函数
- 新增工厂页面时需在此注册路由

**⚠️ 重要: 添加新导航项时必须同步更新四处:**

1. **`src/data/site/navigation.yaml`** — 添加导航结构 (英文 text + href)
2. **`src/components/widgets/Header.astro` 和 `Footer.astro` 的 `navTextMap`** — 添加英文 text → 翻译键的映射
3. **`public/data/i18n-config.json`** — 为所有 37 种语言添加翻译键和对应的翻译文本
4. **`src/i18n/routing.ts` 的 `LOCALIZED_ROUTES`** — 如果新页面需要语言前缀，注册路由

**具体步骤:**

```bash
# 1. 编辑 navigation.yaml 添加新项
# 2. 编辑 Header.astro 和 Footer.astro，在 navTextMap 中添加映射:
#    'New Nav Text': 'nav.newKey',
# 3. 编写脚本或手动编辑 i18n-config.json，为所有 37 语言添加:
#    "nav.newKey": "翻译文本"
# 4. 如果新页面在 [lang]/ 路由下，在 routing.ts 的 LOCALIZED_ROUTES 中添加路径
```

**❌ 常见错误（本次修复的问题）:**

- 只修改了 `navigation.yaml` 和 `navigation.zh.yaml` 等本地化 YAML 文件
- 忘记更新 `navTextMap` 和 `i18n-config.json`
- **结果**: 导航显示英文原文，因为 `t()` 找不到映射键，返回英文 text 作为 fallback

**✅ 正确做法:**

- 本地化 YAML 文件 (`navigation.zh.yaml` 等) **仅供 Keystatic CMS 编辑参考**，不会影响渲染
- 实际的翻译数据在 `i18n-config.json` 中
- 添加新导航项后，务必检查 `navTextMap` 和 `i18n-config.json` 是否同步更新
- **新增品牌/行业页面的导航项**: `Why Inflatable Pool Factory` (Company)、`For Schools` (Solutions)、`For Distributors` (Solutions) 已同步更新到 `navigation.yaml`

### 4.6 翻译键命名约定

翻译键使用点号分隔的层级命名:

```
nav.products       → "Products" / "Productos" / "Produkte" ...
nav.ribBoats       → "RIB Boats" / "Barcos RIB" ...
home.resources.buyersCenter → "Buyers Center"
product.pageDesc   → (所有语言文件中缺失, 从未被提取脚本生成)
```

### 4.7 翻译脚本系统 (2026-08 里程碑)

**翻译成果统计:**

| 指标             | 值                                                                  |
| ---------------- | ------------------------------------------------------------------- |
| i18n 键总数      | 1,721 (EN)                                                          |
| 非英语语言       | 14 (fr/de/es/pt/ar/it/ru/pl/nl/sv/no/el/fi/da)                      |
| 键完全对齐       | 14语言 × 1,721 = 24,094 (0 missing/extra)                           |
| sameAsEn 已翻译  | 3,807 (Google Translate主 + MyMemory备)                             |
| 孤立键已清理     | 2,456 (ar:801, no:798, el:100, fi:757)                              |
| Page YAML 已翻译 | 252/252 (14语言 × 18页面)                                           |
| 剩余 sameAsEn    | 808 (540技术术语 + 109同源词 + 29品牌名 + 124短词/数字 + 6确认保留) |

**翻译脚本:**

| 脚本                                  | 用途                                                    | 标志                   |
| ------------------------------------- | ------------------------------------------------------- | ---------------------- |
| `scripts/translate-i18n-keys.mjs`     | 翻译 sameAsEn i18n 键 (Google Translate主 + MyMemory备) | `--dry-run`, `--force` |
| `scripts/translate-pages.mjs`         | 翻译 page YAML 内容 (Google Translate主 + MyMemory备)   | `--dry-run`, `--force` |
| `scripts/fill-missing-i18n-keys.mjs`  | 用 EN 副本填充缺失 i18n 键 (翻译前 fallback)            | —                      |
| `scripts/fill-missing-page-yamls.mjs` | 用 EN 副本创建缺失 page YAML                            | —                      |
| `scripts/check-translations.mjs`      | 校验 14 语言 i18n 键对齐                                | —                      |

**翻译缓存:** `.cache/i18n-translate-cache.json` + `.cache/page-translate-cache.json` (gitignored)

**不翻译规则:** 技术术语 (Drop-Stitch/Hypalon/PVC/RIB/SUP/OEM/ISO/FAQ/WhatsApp/Inflatable Pool Factory) 所有语言保留原文。同源词 (如法语 "Certifications" = EN "Certifications") 也保留原文——Google Translate 也返回相同值。

---

## 5. 产品页面系统

### 5.1 数据源

产品数据有两层:

**A. 结构化数据** (`src/data/products.ts`):

- TypeScript 数组 `ProductRecord[]`
- 包含 ~40 个产品 (RIB, 充气船, SUP, 配件)
- 字段: `id`, `name`, `category`, `desc`, `definition`, `specs`, `faq` 等
- 所有字段为**英语**, 无翻译

**B. 多语言翻译文本** (`src/data/product-texts.ts`):

- 按语言 × 产品 ID 组织的翻译字典
- 覆盖字段: `name`, `desc`, `definition`, `problem`, `howItWorks`, `audience`, `ai_use_cases`, `ai_comparison`, `ai_faq`
- **注意**: `product.pageDesc` 在所有语言的 UI 生成文件中均**缺失** (提取脚本未包含此键)

**C. 内容集合** (`src/content.config.ts`):

- Astro `defineCollection` 从 `src/content/product/` 加载
- 包含 `title`, `summary`, `description`, `image`, `gallery`, `specs`, `tags` 等

### 5.2 产品页面路径

产品页面有两种路径:

1. **多语言版本**: `/[lang]/products/[slug].astro` (37 种语言 × 产品数)
2. **英语直连**: `/products/[slug].astro` (无语言前缀, 仅英语)

**产品列表页**:

- `/[lang]/products/index.astro` — 每种语言生成一个列表
- `/products/index.astro` — 英语列表

**产品对比页**:

- `/[lang]/products/compare.astro` — 多语言对比
- `/products/compare.astro` — 英语对比

### 5.3 产品详情页渲染流程

```
/content/product/*.md(x)  (内容集合)
  ↓  Astro Content Collections + getNormalizedProduct()
products 数组 (包含 title, summary, description, specs, tags...)
  ↓
[slug].astro:
  1. 从 products 数组找到对应产品
  2. 从 productRecords (products.ts) 获取结构化数据
  3. 生成 JSON-LD Schema
  4. 渲染 ProductLayout
```

### 5.4 产品 Tags 渲染注意事项

Tags 来自内容集合, 正常化为 `{slug, title}` 对象格式:

- 渲染时使用: `String((tag as any)?.title || (tag as any)?.slug || tag || '').trim()`
- **不要直接使用 `{tag}`**, 否则显示 `[object Object]`

### 5.5 产品翻译编辑系统 (15语言)

#### 5.5.1 概述

管理后台支持对 15 种语言的产品翻译进行可视化编辑。翻译数据存储为每产品每语言的 YAML 文件 (`src/data/product-texts/{locale}/{product.id}.yaml`)，在构建时由 `localizeProduct()` 自动合并到产品记录中。

翻译字段限定为纯文本内容 (名称、描述、定义、FAQ 等)，结构化数据 (规格参数、环境、技能水平等) 保持在英文 MDX 中。

#### 5.5.2 数据源层级

```
MDX Frontmatter (English, src/content/products/*.mdx)
  └─ 结构化字段: title, summary, description, gallery, specs, sku, price, tags, environment, water_condition, skill, definition, problem, howItWorks, audience, ai_use_cases, ai_comparison, ai_faq, ai_specs
       ↓
products.ts (ProductRecord[], src/data/products.ts)
  └─ 所有字段为英文, 包含: id, name, desc, definition, problem, howItWorks, audience, skill, environment, water_condition, safety_rules, safety_level, region, ai_use_cases, ai_specs, ai_comparison, ai_faq
       ↓
product-texts.ts (src/data/product-texts.ts, 4096 行 TS 模块)
   └─ 翻译字典 (8 语言种子: fr/de/es/pt/it/ru/pl/ar, 其余语言回退英文)
       ↓
YAML 文件 (src/data/product-texts/{locale}/{product.id}.yaml) ← 新增
  └─ 每产品每语言的 YAML 文件, 通过后台管理面板编辑, 优先于 TS 模块
```

**回退链 (Fallback Chain)**:

1. YAML 文件存在 → `yaml.load()` 读取, 合并到 `ProductRecord`
2. YAML 不存在 → 从 `product-texts.ts` TS 模块获取翻译
3. 都不存在 → 使用英文原文

#### 5.5.3 翻译字段清单

| YAML Key        | 表单 Input              | 映射方式              | 说明         |
| --------------- | ----------------------- | --------------------- | ------------ |
| `name`          | `title`                 | `data-fm-path="name"` | 产品名称     |
| `summary`       | `summary`               | name 匹配             | 一句话简介   |
| `desc`          | `description`           | `data-fm-path="desc"` | 详细描述     |
| `definition`    | `definition`            | name 匹配             | 产品定义     |
| `problem`       | `problem`               | name 匹配             | 解决的问题   |
| `howItWorks`    | `howItWorks`            | name 匹配             | 工作原理     |
| `audience`      | `audience`              | name 匹配             | 目标受众     |
| `ai_use_cases`  | `ai_use_cases[]`        | repeater              | 使用场景数组 |
| `ai_comparison` | `ai_comparison`         | name 匹配             | 竞品对比     |
| `ai_faq`        | `ai_faq_q` / `ai_faq_a` | repeater              | 常见问题数组 |

#### 5.5.4 渲染流程 (Public Page)

```
[lang]/products/[slug].astro
  ↓
productRecords.find((p) => p.id === product.slug) → recRaw
  ↓
localizeProduct(recRaw, lang)  (src/utils/product-i18n.ts)
  ├─ 1. fs.existsSync('src/data/product-texts/{locale}/{id}.yaml')
  │     └─ 是 → yaml.load() → merge into ProductRecord
  ├─ 2. 否 → productTexts[locale]?.[id] → merge into ProductRecord
  └─ 3. 都无 → 返回原始 ProductRecord (英文)
  ↓
rec (本地化 ProductRecord) → 页面各 section 渲染
```

#### 5.5.5 管理后台编辑流程

##### 读取 (Load)

```
页面加载 (locale='en'):
  FormDataLoader.astro 自动执行:
  1. fetch GET /api/admin/read?format=frontmatter&path=src/content/products/{slug}.mdx
  2. Worker 解析 MDX frontmatter → 返回 { parsed: frontmatter, body }
  3. fillFields(data) 填充所有表单字段
  4. fillRepeater() 填充 gallery, specs, ai_faq 等重复区域

切换语言 (locale='zh', 用户选择):
  ProductForm.astro inline script 执行:
  1. updateLangUI() 隐藏非翻译字段区域 (gallery, specs, environment, body, SEO 等)
  2. 显示提示 "Editing translation — only text fields shown"
  3. FormDataLoaderFn() 执行:
     a. fetch GET /api/admin/read?format=yaml&path=src/data/product-texts/zh/{slug}.yaml
     b. Worker: yaml.load(decoded) → 返回 { parsed: { name, desc, ... } }
     c. 仅填充 TRANSLATABLE_FIELDS 中的输入
     d. 填充 ai_use_cases 和 ai_faq 重复区域
```

##### 保存 (Save)

```
用户点击 "Save Draft":
  save(branch) 函数检查 locale:

  英语 (locale === 'en'):
  ├─ collectFrontmatter(data):
  │   ├─ title, publishDate, draft, inStock, featured
  │   ├─ sku, summary, description, image, category
  │   ├─ gallery[], specs[], tags[], environment[], water_condition[]
  │   ├─ definition, problem, howItWorks, audience, skill
  │   ├─ ai_use_cases[], ai_comparison, ai_faq[], ai_specs{}
  │   ├─ price{}, metadata{} (SEO)
  │   └→ 返回 frontmatter 对象
  ├─ serializeFrontmatter(fm) → "---\n...\n---"
  ├─ content = frontmatter + body
  └─ POST /api/admin/update { content, sha, message }

  翻译 (locale !== 'en'):
  ├─ collectTranslatable(data):
  │   ├─ name, summary, desc, definition, problem
  │   ├─ howItWorks, audience, ai_comparison
  │   ├─ ai_use_cases[], ai_faq[]{q, a}
  │   └→ 返回 { name, summary, desc, ... }
  ├─ 使用 form.dataset.sha (YAML 文件 SHA, 非 MDX _sha)
  └─ POST /api/admin/update { format: 'yaml', data: { ... }, sha }
      └─ Worker: yaml.dump(data, { lineWidth: -1 }) → b64encode → GitHub PUT
```

#### 5.5.6 关键文件

| 文件                                        | 作用                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/admin/ProductForm.astro`    | 产品编辑表单: 15 语言选择器、字段分组、语言切换 JS (show/hide/reload)                    |
| `src/components/admin/FormDataLoader.astro` | 通用数据加载器: 从 GitHub 读取 frontmatter/YAML 并填充表单                               |
| `src/pages/keystatic/products/[slug].astro` | 后台产品编辑页面: collectFrontmatter(), collectTranslatable(), save()                    |
| `src/utils/product-i18n.ts`                 | 构建时翻译合并: YAML 优先 → TS 模块回退 → 英文默认                                       |
| `src/data/product-texts.ts`                 | 翻译字典: 15 语言 × ~40 产品的 TS 模块 (4096 行)                                         |
| `src/data/products.ts`                      | 产品结构化数据: ProductRecord[] (63 产品)                                                |
| `workers/admin-worker/index.ts`             | Worker API: `/api/admin/read` (frontmatter+yaml), `/api/admin/update` (支持 format:yaml) |

#### 5.5.7 重要注意事项

1. **字段名映射**: YAML 使用 `name` (非 `title`) 和 `desc` (非 `description`)。表单输入通过 `data-fm-path` 属性进行映射：
   - `title` input → `data-fm-path="name"`
   - `description` textarea → `data-fm-path="desc"`
   - 其他字段 input name 与 YAML key 一致

2. **SHA 独立管理**: YAML 文件的 SHA 存储在 `form.dataset.sha` 中，与 MDX 文件的 `_sha` hidden input 完全独立。首次保存新翻译 (文件不存在) 时不带 SHA，后续更新使用 `form.dataset.sha`。

3. **UTF-8 编码**: admin-worker 必须使用 `b64encode()` (基于 `TextEncoder`) 而非 `btoa()` 进行 Base64 编码。`btoa()` 无法处理多字节 UTF-8 字符 (中文、法语重音等)，会导致乱码。详见 §11.8 编码铁律。

4. **不可翻译字段**: `environment`, `water_condition`, `skill`, `safety_rules`, `safety_level`, `region` 等字段在英文 `ProductRecord` 中定义，不参与翻译。切换语言时这些字段的编辑区域会被隐藏。

5. **构建时依赖**: `product-i18n.ts` 使用 `fs.existsSync` + `fs.readFileSync` 在 Node.js 构建环境下读取 YAML 文件。YAML 文件必须通过 `git push` 存在于仓库中才能被构建使用。

6. **新建翻译文件**: 当某语言的某个产品首次保存时，`save()` 不传 SHA → Worker 的 `/api/admin/update` 视为创建新文件。YAML 文件写入 draft 分支，发布后合并到 main。

---

## 6. 数据流与渲染管线

### 6.1 数据流向

```
                       ┌──────────────────────┐
                       │  scripts/ 构建脚本     │
                       │  (geo-build / _gen-*) │
                       └────────┬─────────────┘
                                ↓
  ┌─────────────────────────────────────────────┐
  │  生成数据:                                   │
  │  src/i18n/generated/ui/*.ts  (15 语言翻译)   │
  │  src/i18n/generated/ui-all.ts (合并入口)     │
  │  src/i18n/generated/pages/*  (页面内容)      │
  │  src/i18n/generated/site-data.ts (site-* 键)  │
  │  src/i18n/generated/i18n-config.json        │
  └─────────────────────────────────────────────┘
                                ↓
  ┌─────────────────────────────────────────────┐
  │  Astro 静态构建 (output: 'static')           │
  │  并行渲染 ~645 个页面                        │
  │  每个页面独立运行 frontmatter script         │
  └─────────────────────────────────────────────┘
                                ↓
  ┌─────────────────────────────────────────────┐
  │  dist/ 静态文件                              │
  │  Cloudflare Pages 部署                       │
  └─────────────────────────────────────────────┘
```

### 6.2 关键注意事项

- **Astro `output: 'static'`**: 所有页面在构建时预渲染, 无 SSR
- **并行渲染竞态**: ~645 页面同时渲染, `setLang()` 修改模块级 `_ui` 对象会导致数据竞争
- **解决方案**: 所有组件使用 `getUiForLang(locale)` 直接获取翻译, 不依赖 `_ui`
- **`setLang()` 保留**: `Layout.astro` 仍调用 `setLang()`, 但仅为了向后兼容 (老代码可能仍引用 `ui`)

---

## 7. Cloudflare Workers

项目有 **5 个独立的 Cloudflare Workers** (+ 共享代码目录 `workers/shared/`):

> `seo-worker` (inflatable-pool-factory-seo) 已于 2026-08-18 删除 — 其端点 (search/geo-score/page-inspect/seo/*) 均为硬编码演示响应, 无生产调用, 且 CI 不部署。

| Worker     | 名称                                 | 路由                                                                                   | 存储                 | 用途                                                                                                 |
| ---------- | ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| Admin      | `inflatable-pool-factory-admin`      | `/api/admin/*`, `/api/auth/*`                                                          | D1, R2 (data)        | better-auth 认证, GitHub CRUD, D1 查询, 询盘 CSV 导出 + 附件下载                                     |
| AI         | `inflatable-pool-factory-ai`         | `/api/chat*`, `/api/ask*`, `/api/search*`, `/api/embed*`, `/api/reindex*`, `/api/ai/*` | Vectorize, R2 (data) | AI 问答/搜索/嵌入 + 知识库增量重建 (cron: 每天 3AM, corpus 哈希跳过) + R2 限流/答案缓存/每日嵌入预算 |
| Automation | `inflatable-pool-factory-automation` | `/api/automation/*`                                                                    | R2 (data), D1        | 定时任务 (cron: 每天 2AM, D1 清理 + IndexNow)                                                        |
| Contact    | `inflatable-pool-factory-contact`    | `/api/contact*`                                                                        | D1, R2 (data)        | 联系表单 (Turnstile + 限流 + D1 存储 + 可选附件上传 R2)                                              |
| News       | `inflatable-pool-factory-news`       | `/{lang}/news*`, `/{lang}/rss.xml`, `/sitemap-news.xml`, `/llms/news*`                 | D1 (news 表)         | 新闻/RSS/新闻 sitemap (D1 驱动, 无静态页)                                                            |

**D1 数据库 `inflatable-pool-factory-db`** (admin/contact/news/automation 共享) 主要表:

- `inquiry` — 联系表单提交 (IP/UA/语言/附件 R2 key `logoKey`)
- `news` — 新闻文章 (news-worker + admin 撰写)
- `rate_limit` — 联系表单按 IP 限流 (每 IP 每小时 5 次)
- `user` / `session` / `account` / `verification` / `rateLimit` — better-auth 会话管理与认证限流
- 迁移位于 `migrations/`，由 `wrangler d1 migrations apply inflatable-pool-factory-db` 应用 (CI 首次部署自动执行)

### 7.1 3MB Worker 限制

**每个 Worker 的编译后 JS 必须 < 3MB** (Cloudflare Workers 的限制)。

如果在 Worker 中遇到 `Error: Your worker size is 3.1 MB which exceeds the 3 MB limit`, 说明引入了过大的依赖。

**解决思路**:

- 检查 `import` 是否引入了大型库
- 数据放在 R2 / D1，不要打包进 Worker
- 考虑将大逻辑拆分为多个 Worker
- 避免在 Worker 中 `import` 整个 Astro 项目的 `src/` 文件

### 7.2 Worker 构建和部署

```bash
# 部署单个 Worker
npm run deploy:worker-contact
npm run deploy:worker-ai
npm run deploy:worker-admin
npm run deploy:worker-news
npm run deploy:worker-automation

# 部署所有 5 个 Worker (scripts/deploy-workers.mjs, 并行执行 ~5x 加速)
npm run deploy:workers
```

### 7.3 管理员认证配置 (better-auth)

管理后台登录 (`/login`, `/keystatic/*`) 使用 **better-auth**，运行在 `inflatable-pool-factory-admin` Worker 上（`workers/shared/auth.ts` 是共享配置）：

| 项目       | 说明                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| 登录方式   | Google OAuth + 邮箱/密码（可选 GitHub OAuth，配置了 `GITHUB_CLIENT_ID/SECRET` 时启用） |
| 会话存储   | **D1** `session` 表 (`drizzleAdapter`, sqlite)                                         |
| 管理员角色 | `ADMIN_EMAILS` secret (逗号分隔的邮箱列表) → `isAdminEmail()` 判定 + admin 插件角色    |
| 验证码     | 登录页 Turnstile (`TURNSTILE_SECRET_KEY`)                                              |
| 密码重置   | email/password 启用了 `sendResetPassword`（占位实现）                                  |
| 用户管理   | `/keystatic/users`（admin 插件：ban/delete/impersonate/session 管理）                  |

**Secrets（通过 `wrangler secret put` 或 CI `secret bulk` 设置）:**

```bash
npx wrangler secret put BETTER_AUTH_SECRET --name inflatable-pool-factory-admin   # 会话签名密钥 (openssl rand -base64 32)
npx wrangler secret put ADMIN_EMAILS --name inflatable-pool-factory-admin         # 管理员邮箱列表
npx wrangler secret put GOOGLE_CLIENT_ID --name inflatable-pool-factory-admin     # Google OAuth
npx wrangler secret put GOOGLE_CLIENT_SECRET --name inflatable-pool-factory-admin
npx wrangler secret put TURNSTILE_SECRET_KEY --name inflatable-pool-factory-admin # 登录验证码
npx wrangler secret put GITHUB_TOKEN --name inflatable-pool-factory-admin         # CMS 内容写入 PAT
npx wrangler secret put SESSION_SECRET --name inflatable-pool-factory-admin       # legacy HMAC 回退
```

> `SESSION_SECRET` + `src/lib/auth.ts` (HMAC-SHA256) 保留为 **legacy 回退**，与旧 cookie (`ks-admin-session`) 兼容；新登录全部走 better-auth cookie (`csr_session`)。`ADMIN_USERNAME / ADMIN_PASSWORD_HASH` 与 `src/data/admin-auth.json` 同样仅作 legacy 回退，不推荐继续使用。

**登录字段对应关系：**

- 登录页表单提交到 better-auth 端点 (`/api/auth/...`)，不再是自定义 `/api/auth/login` 的账号密码
- 默认凭据不再存在——管理员通过 Google OAuth 或邮箱注册，邮箱必须在 `ADMIN_EMAILS` 中才会获得 admin 角色

---

## 8. Cloudflare Pages Functions

### 8.1 `functions/_middleware.ts`

Cloudflare Pages 自带的中间件, 在请求到达静态文件之前执行:

**主要功能**:

1. **R2 资源跳转**: 将 `/images/*` 和 `/files/*` 请求 301 重定向到 `https://assets.inflatablepoolfactory.com`
2. **国际化检测**: 检测用户语言, 非英语用户 302 重定向到对应语言版本
3. **管理员页面保护**: `/keystatic`, `/admin` 路径的访问控制

**语言检测优先级**:

1. Cookie `x-user-locale`
2. `cf-ipcountry` (Cloudflare 地理 IP)
3. `Accept-Language` 请求头
4. 默认英语 (`en`)

**注意**: 此文件是 Cloudflare Pages Functions, **不是 Astro 中间件**, 运行在边缘环境。它不共享 Node.js 模块, 使用独立的运行时。

### 8.2 `I18N_EXCLUDED` — 国际化排除路径

**用途**: 中间件中的 `I18N_EXCLUDED` 列表定义了哪些路径不需要执行语言检测和重定向。

**根级路径 vs 本地化路径**:

| 路径                                 | 行为                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `/solutions-diving-center-boats/`    | 在 `I18N_EXCLUDED` 中 → 直接返回根级 Astro 页面                                          |
| `/en/solutions-diving-center-boats/` | **不在** `I18N_EXCLUDED` 中 → 需要对应 `[lang]/solutions-diving-center-boats.astro` 页面 |

**常见问题 — 404 路由问题**:

导航链接使用 `/{lang}/solutions-fishing-boat-solutions`（带语言前缀），但如果 `[lang]/` 下没有对应的 Astro 页面路由，Cloudflare Pages 会返回 404。

**解决模式**:

1. 在 `src/pages/` 下创建根级 `.astro` 页面（英语直接展示，加入 `I18N_EXCLUDED`）
2. 在 `src/pages/[lang]/` 下创建同名的 Astro 页面，重定向到实际的本地化页面路径
3. 重定向 HTML 使用 `<meta http-equiv="refresh">` + `<link rel="canonical">`，搜索引擎能正确索引目标页面

**示例** — `/en/solutions-fishing-boat-solutions` → `/en/solutions/fishing-boat-solutions`:

```astro
---
const lang = Astro.params.lang || 'en';
const target = `/${lang}/solutions/fishing-boat-solutions`;
---

<!doctype html>
<title>Redirecting to: {target}</title>
<meta http-equiv="refresh" content={`0;url=${target}`} />
<meta name="robots" content="noindex" />
<link rel="canonical" href={`https://inflatablepoolfactory.com${target}`} />
<body>
  <a href={target}>Redirecting to {target}</a>
</body>
```

---

## 9. R2 存储

### 9.1 Bucket 配置

| Bucket 名称                      | 绑定名        | 用途                       |
| -------------------------------- | ------------- | -------------------------- |
| `inflatable-pool-factory-assets` | `ASSETS_R2`   | 静态资产 (图片, 文件)      |
| `inflatable-pool-factory-data`   | `DATA_BUCKET` | 数据 (AI 索引, 自动化任务) |

### 9.2 资产上传与自动 prune (2026-10)

```bash
npm run build:r2   # 或 node scripts/fast-upload-r2.mjs
```

上传后的资产通过 `https://assets.inflatablepoolfactory.com/...` 访问。

**自动 prune**: `fast-upload-r2.mjs` 在每次上传后自动清理 R2 中"本地已不存在"的过期对象（覆盖 `data/`、`images/`、`files/` 前缀）。护栏：

- 本地前缀为空 → 跳过该前缀的 prune
- 过期对象 > 200 个 → 中止 prune 并告警（防止误删事故扩散）
- prune 失败**不会**使部署失败（仅告警）

验证记录：P6 WebP 迁移后 15 张旧 PNG/JPG 已被自动 prune（404 确认），新 WebP 均 200。见 `docs/technical-audit-2026-10.md` §2.3。

### 9.3 URL 重写

静态文件中的图片 URL 会被重写:

- 原始: `/images/product/foo.jpg`
- 重写后: `https://assets.inflatablepoolfactory.com/images/product/foo.jpg`

由 `functions/_middleware.ts` 处理: 匹配 `/images/*` 和 `/files/*` → 301 重定向到 `ASSETS_BASE`。

---

### 10.4 GitHub Actions CI/CD

> **目前状态**: 两个工作流均已投入使用。`ci.yml` 是 PR 质量门禁，`deploy.yml` 是 main 分支部署流水线（含 Cloudflare 凭据守卫，未配置凭据时自动跳过 Cloudflare 步骤而不报错）。

**PR 门禁** (`.github/workflows/ci.yml`):

```text
pull_request →
  npm ci
  → npm run check (astro check + eslint + prettier + i18n, 0 errors 门禁)
  → npm run build (含 PUBLIC_TURNSTILE_SITE_KEY)
  → wrangler deploy --dry-run (admin / contact / news / automation 4 个 Worker 编译检查)
```

**部署流水线** (`.github/workflows/deploy.yml`, push to main):

```text
guard (探测 CLOUDFLARE_API_TOKEN/ACCOUNT_ID → enabled=true|false)
  → npm ci → npm run check → npm run build
  → node scripts/fast-upload-r2.mjs        (上传资产到 R2 + 自动 prune 本地已删除的 R2 对象)
  → npx wrangler pages deploy dist/        (部署 Pages)
  → 注入 CF_PROD_D1_ID 到 workers/*/wrangler.toml
  → wrangler d1 migrations apply (首次) + seed-news.mjs (news 表为空时)
  → wrangler secret bulk (contact: RESEND/Turnstile; admin: better-auth/Google/Turnstile)
  → npm run deploy:workers                (5 个 Worker 并行部署)
  → curl purge_cache (清 CDN 缓存)
```

### 10.5 必需的 GitHub Secrets

> **首次部署完整步骤**（Cloudflare 资源创建、域名 NS 迁移、第三方密钥、Secrets 设置路径、验证清单）见 **[`SETUP.md`](./SETUP.md)**。CI 只向已存在的资源内部署，Pages 项目 / R2 桶 / D1 / zone 均需先手动创建。

| Secret 名称               | 用途                                               | 来源                                           |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | 用于 `wrangler deploy` 的 Cloudflare API 令牌      | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID`   | Cloudflare 账户 ID                                 | Cloudflare Dashboard 右侧                      |
| `CLOUDFLARE_ZONE_ID`      | Zone ID (CDN 缓存清理)                             | Cloudflare Dashboard → Domain                  |
| `CF_PROD_D1_ID`           | D1 数据库 ID (注入 wrangler.toml)                  | `wrangler d1 list`                             |
| `TURNSTILE_SITE_KEY`      | Turnstile 站点密钥 (公开, 注入构建)                | Cloudflare Turnstile 面板                      |
| `TURNSTILE_SECRET_KEY`    | Turnstile 密钥 (contact + admin Worker)            | Cloudflare Turnstile 面板                      |
| `RESEND_API_KEY`          | Resend 邮件 API                                    | Resend Dashboard                               |
| `CONTACT_EMAIL_TO`        | 联系表单通知收件人                                 | —                                              |
| `BETTER_AUTH_SECRET`      | better-auth 会话签名密钥                           | `openssl rand -base64 32`                      |
| `ADMIN_EMAILS`            | 管理员邮箱列表 (逗号分隔)                          | —                                              |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth 登录                                  | Google Cloud Console                           |
| `SESSION_SECRET`          | legacy HMAC 回退 (缺省时回落到 BETTER_AUTH_SECRET) | `openssl rand -hex 32`                         |

> 部署无需手动操作：push 到 `main` 自动完成构建、部署、D1 迁移、secret 同步与缓存清理。本地手动部署命令仍可用：`npm run deploy:all`。

---

## 10. 部署架构与限制

### 10.1 部署架构图

```
用户请求
  ↓
Cloudflare CDN (全球边缘网络)
  ├─ www.inflatablepoolfactory.com/* → apex 301 (Dashboard Redirect Rule, 单跳, 路径保留 — 2026-10 配置, 非 _redirects)
  ├─ Pages Functions (_middleware.ts) → 语言检测 / 重定向
  └─ 静态文件 (dist/)
       ├─ / → index.html (英语首页)
       ├─ /fr/ → 法语页面
       ├─ /products/ → 英语产品页
       └─ ...
  ↓
API / 动态请求
  ├─ ai-worker → Vectorize + R2
  ├─ admin-worker → better-auth + GitHub CRUD + D1
  ├─ contact-worker → D1 + Turnstile + Resend
  ├─ news-worker → D1 (news/rss)
  └─ automation-worker → D1 清理 + IndexNow + R2 (定时任务)
```

### 10.2 关键限制

| 限制项               | 值                                | 说明                             |
| -------------------- | --------------------------------- | -------------------------------- |
| **Workers 编译大小** | **< 3 MB**                        | 每个 Worker 的 JS 必须小于 3MB   |
| **Pages 部署**       | `npx wrangler pages deploy dist/` | 纯静态, 无 SSR                   |
| **页面数量**         | ~645 页                           | 37 语言, 降级语言 canonical 折叠 |
| **构建时间**         | ~2-3 分钟 (本地实测)              | ~645 页静态渲染 + GEO 生成       |
| **Node 版本**        | >= 22.12.0                        | 项目强制要求                     |
| **包管理**           | npm                               | `npm ci` (CI) / `npm install`    |
| **静态输出**         | `dist/`                           | `output: 'static'`, 无适配器     |
| **D1 数据库**        | `inflatable-pool-factory-db`      | inquiry/news/rate_limit/auth 表  |

### 10.3 部署命令

```bash
# 完整部署 (构建 + 部署 Pages + 部署 Workers)
npm run deploy:all

# 或分步:
npm run build                          # 构建
npx wrangler pages deploy dist/        # 部署 Pages
npm run deploy:workers                 # 部署 Workers
node scripts/fast-upload-r2.mjs        # 上传 R2 资产
```

---

## 11. 常见错误及避免方法

### 11.1 `[object Object]` 显示在页面上

**原因**: 直接渲染对象而没有调用 `.title` 或 `.slug` 等属性。

**常见场景**: Tags 渲染。

**修复方法**:

```astro
<!-- ❌ 错误 -->
<span>{tag}</span>

<!-- ✅ 正确 -->
<span>{String((tag as any)?.title || (tag as any)?.slug || tag || '').trim()}</span>
```

### 11.2 导航/页脚显示错误语言

**原因**: 使用了 `(ui as any)[key]` 从共享可变 `_ui` 对象读取翻译, 但 `_ui` 被其他并行渲染的页面覆盖。

**修复方法**:

```text
<!-- ❌ 错误 (依赖共享 _ui) -->
import { ui } from '~/i18n/config';
<span>{(ui as any)['nav.products']}</span>

<!-- ✅ 正确 (直接获取) -->
import { getUiForLang } from '~/i18n/generated/ui-all';
const t = (key: string) => getUiForLang(locale)?.[key] || key;
<span>{t('nav.products')}</span>
```

**注意**: 所有从 `~/i18n/config` 导入 `ui` 或使用 `(ui as any)` 的代码都应该被替换。

### 11.3 页面显示乱码 (garbled Chinese text)

**原因**: 文件编码问题, 非 ASCII 字符在保存时被错误编码。

**修复方法**:

- 确保所有 `.astro`, `.ts`, `.json` 文件使用 **UTF-8 without BOM** 编码
- 检查脚本: `python scripts/find-garbled.py` 或 `python scripts/check-encoding.py`
- 修复脚本: `python scripts/fix-garbled.py`
- 避免在源文件中使用非标准 Unicode 字符

### 11.4 缺失翻译键导致页面显示键名

**原因**: UI 生成脚本未提取某翻译键, 所有语言的 `ui/*.ts` 文件 (`src/i18n/generated/ui/`) 中都缺失。

**示例**: `product.pageDesc` 在所有 `ui/*.ts` 文件中缺失。

**修复方法**:

1. 在 UI 提取脚本 `scripts/_gen-uiall.cjs` 中添加新键
2. 重新运行 `npm run build` 重新生成 `ui/*.ts`
3. 或者在各语言页面中直接使用 `productTexts` 数据 (`src/data/product-texts.ts`)

### 11.5 构建时类型错误 (astro check)

**✅ 当前状态**: `astro check` **0 错误** — 历史上的 ~350 个预存错误（`_keystatic/` 编码问题、Worker 类型问题等）已全部修复，且 `npm run check` 现在是 CI 的门禁（PR 未通过不允许合并）。

**准则**:

- 修改代码后必须运行 `npm run check` 确认 **0 错误 0 警告**
- 新增 Worker 代码注意 Cloudflare 运行时的类型差异（用 `wrangler deploy --dry-run` 验证）

### 11.10 CI `npm ci` 报 EUSAGE (lock 与 package.json 不同步)

**现象**: CI 报 `npm error Invalid: lock file's X@a.b.c does not satisfy X@a.b.d` 或 `Missing: X from lock file` — 通常是依赖发布了 range 内的新版本 (eslint、@typescript-eslint/*、@cloudflare/workers-types 等), 或 lock 由 `--legacy-peer-deps` 生成导致 peer 条目缺失。

**修复**:

```bash
npm update          # 全量更新到 range 内最新 (普通 npm install 不会 bump)
npm ci --dry-run    # 本地验证 lock 与 package.json 同步
npm run build       # 验证构建
```

**预防**: 不要用 `--legacy-peer-deps` 安装 (astro-auto-import 0.5.2 起 peer 可干净解析)；锁变更后提交 `package-lock.json`。

### 11.11 Cloudflare Pages 部署失败: 单文件 ≥ 25 MiB

**现象**: `wrangler pages deploy` 报 `Error: Pages only supports files up to 25 MiB in size — data/page-content.json is 27 MiB`。

**原因**: 生成脚本曾把全量 15 语言内容 JSON (27 MiB) 写入 `public/data/`，Astro 会拷贝进 `dist/` 上传。该文件只被构建期脚本消费、无运行时 fetch，不该进 public/。

**修复**: 大 JSON 只写 `src/i18n/generated/` (gitignored, 构建期读取)，绝不写 `public/`；`site-*` 键拆到 `site-data.ts` (2.2 MiB)，`content-v2*` 键排除 (由 `src/data/content-v2.ts` 直接读 YAML)。

### 11.6 PowerShell 编码问题 (TROUBLESHOOTING.md §5.2)

PowerShell 5.1 默认使用 ANSI 编码，会破坏 UTF-8 多字节字符。

```powershell
# ❌ 错误 — 破坏 UTF-8
Set-Content -Path file.astro -Value $newContent

# ✅ 正确 — 保留 UTF-8
[System.IO.File]::WriteAllText($Path, $content, [System.Text.UTF8Encoding]::new($false))
```

### 11.7 `&rarr;` HTML 实体污染 (TROUBLESHOOTING.md §5.5)

不要在源文件中使用 HTML 实体 `&rarr;`，使用字面 Unicode 箭头 `→`。在 Astro 模板、YAML 文件或组件 props 中，`&rarr;` 经常被双重转义为 `&amp;rarr;`。

### 11.8 编码铁律 (TROUBLESHOOTING.md §3.3)

| #   | 规则               | 原因                                    |
| --- | ------------------ | --------------------------------------- |
| 1   | **UTF-8 无 BOM**   | BOM 导致 YAML 解析错误                  |
| 2   | **只用目标语言**   | 不要在欧洲语言文件中包含中文/日文/韩文  |
| 3   | **不要中转翻译**   | 英语→法语 直接翻译，不要 英语→中文→法语 |
| 4   | **正确 Unicode**   | 使用正确的 Unicode 码点，不要双重编码   |
| 5   | **CJK 文件**       | 确保包含有效的原生字符                  |
| 6   | **不要 AI 重编码** | 验证 AI 输出是正确的 UTF-8              |
| 7   | **修改后验证**     | 运行 `node i18n-tool.cjs check`         |
| 8   | **YAML 有效性**    | 确保引号闭合、缩进一致                  |
| 9   | **默认英语**       | 先写英语内容，再翻译                    |
| 10  | **不要 .bak 文件** | 提交前清理备份文件                      |

### 11.9 导航项显示英文而非翻译文本

**原因**: 新导航项添加到了 `navigation.yaml`，但 `navTextMap` 或 `i18n-config.json` 未同步更新。

**完整修复流程**:

1. 在 `Header.astro` / `Footer.astro` 的 `navTextMap` 中添加 text → 翻译键映射
2. 在 `public/data/i18n-config.json` 中为所有 15 语言添加翻译键值对
3. 运行 `node scripts/_gen-uiall.cjs` 重新生成 UI .ts 文件
4. 运行 `npm run build` 验证

**避免方法**:

- 添加新导航项后检查 `navTextMap` 是否包含新 text 值
- 检查 `i18n-config.json` 是否包含新翻译键
- 验证中文/日文等非英语页面导航显示

### 11.11 页面 404 — 根级页面存在但 `/{lang}/` 路由缺失

**场景**: 根级页面 `/solutions-fishing-boat-solutions` 正常访问 (200)，但导航指向 `/{lang}/solutions-fishing-boat-solutions` 返回 404。

**根因**: 两层路由缺失：

| 层级                  | 问题                                                                                                     | 说明                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. 根级 `.astro` 文件 | 4 个解决方案页面（fishing, marine-tourism, rescue, yacht-tender）缺少 `src/pages/solutions-*.astro` 文件 | 只有 diving 页面存在根级文件                                                                          |
| 2. 本地化重定向页面   | 5 个解决方案页面均缺少 `src/pages/[lang]/solutions-*.astro` 文件                                         | 导航生成 `/{lang}/solutions-*` 链接，但本地化内容在 `[lang]/solutions/*` 路径（无 `solutions-` 前缀） |

**修复方法**:

1. 创建根级 `.astro` 页面（加入 `functions/_middleware.ts` 的 `I18N_EXCLUDED` 列表）
2. 创建 `[lang]/solutions-*.astro` 页面，使用 `<meta http-equiv="refresh">` 重定向到实际的 `[lang]/solutions/*` 页面
3. 构建验证：`npm run build` 后检查 `dist/` 中是否生成对应的 `index.html`

**验证命令**:

```bash
curl -sL -o /dev/null -w "%{http_code}" https://inflatablepoolfactory.com/en/solutions-fishing-boat-solutions/
# 期望: 200 (跟随重定向到 /en/solutions/fishing-boat-solutions/)
```

**避免方法**:

- 新建页面时同步创建根级页面和 `[lang]/` 下的重定向页面
- 修改导航链接路径时确认对应的 Astro 路由是否存在
- 构建后检查 `dist/` 目录下是否包含所有预期的路径

### 11.13 乱码问题 (U+FFFD / garbled text)

**现象**: 页面显示 `�` (U+FFFD 替换字符) 或中文/特殊字符显示为乱码。

**原因**:

1. Keystatic/GitHub 内容源文件的 UTF-8 编码在传输或存储过程中损坏
2. Powershell 的 `Set-Content` 默认使用 ANSI 编码，破坏 UTF-8 多字节字符
3. 过于激进的清理脚本（如 `replace(/[^\x00-\x7F]/g, '')` 或 `replace(/\(\s*\)/g, '')`）误删合法代码

**修复方法（靶向修复，不要一刀切）**:

```bash
# ✅ 正确：只替换 U+FFFD 替换字符
node -e "fs.writeFileSync('file.astro', fs.readFileSync('file.astro','utf8').replace(/\uFFFD/g,' '), 'utf8')"
```

```bash
# ❌ 错误：删除所有非 ASCII 字符 — 会破坏：
#   - © · → × ⚠️ 🔍  等合法符号
#   - é ç ñ ê 等法语/西班牙语重音字符
#   - 中文 UI 描述（CMS 面板双语标签）
#   - 方法调用如 .toString() .trim() 中的 ()
```

**需要保留的合法非 ASCII 内容**:

| 类别         | 示例                   | 所在文件                             |
| ------------ | ---------------------- | ------------------------------------ |
| 版权/商标    | `©`, `®`, `™`          | branding.astro                       |
| 标点符号     | `·`, `→`, `×`          | branding, navigation, link-refactor  |
| 警告符号     | `⚠️`                   | navigation.astro                     |
| Emoji        | `🔍`                   | index.astro                          |
| 重音字符     | `é`, `ç`, `ñ`, `ê`     | countries.astro (Français, Español)  |
| 中文 UI 标签 | `编辑站点名称`、`品牌` | branding.astro, seo.astro (双语 CMS) |

**避免方法**:

- 始终使用 `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))` 而不是 `Set-Content`
- 清理脚本中只对 `\uFFFD` 做替换，不碰其他字符
- 修改后运行 `git diff` 检查是否有意外删除的代码行
- 在 CI 中运行 `astro check` 确保 0 错误

### 11.14 readTokenFromCookies 解密失败导致 Bad credentials

**现象**: 在后台成功保存 GitHub Token 后，页面仍然显示 `Failed to read: Bad credentials`。

**原因**: Worker (`/api/admin/save-token`) 将 token 以**明文**（URL-encoded）存入 cookie `ks-gh-token`，但 Astro 前端的 `readTokenFromCookies()` 始终尝试用 AES-256-GCM `decryptToken()` 解密。解密失败返回 `null` → `GitHubClient('')` 发送空 token → GitHub 返回 "Bad credentials"。

**修复**: `readTokenFromCookies` 先尝试解密，失败则回退读取原始值：

```ts
export function readTokenFromCookies(cookies): string | null {
  const raw = cookies.get('ks-gh-token')?.value;
  if (!raw) return null;
  const decrypted = decryptToken(raw); // 尝试解密（Node.js saveTokenCookie 存的是加密格式）
  if (decrypted) return decrypted;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  } // 回退原始值（Worker 存的是明文）
}
```

**避免方法**:

- 确保 Worker 和 Astro 前端使用一致的 token 存储格式
- 如果使用两种存储路径（Worker 存明文、Node.js 存加密），`readTokenFromCookies` 必须兼容两种格式

### 11.15 esbuild Unexpected "t" — import/export 顺序

**现象**: 构建时 `esbuild` 报错 `Unexpected "t"`，指向 `export const prerender = true;`。

**原因**: esbuild 要求静态 `import` 声明必须出现在任何 `export` 之前。Keystatic 页面将 `export const prerender` 放在了 `import` 之前。

```text
---
<!-- ❌ 错误：export 在 import 之前 -->
export const prerender = true;
import AdminLayout from '~/layouts/AdminLayout.astro';

<!-- ✅ 正确：import 必须在 export 之前 -->
import AdminLayout from '~/layouts/AdminLayout.astro';
export const prerender = true;
---
```

**修复**: 将 42 个 keystatic 页面的 `import` 语句移到 `export` 之前。

**避免方法**:

- Astro frontmatter 中始终先写 `import`，再写 `export`
- 提交前运行 `astro build` 或 `astro check` 验证

### 11.16 登录重定向循环

**现象**: 登录成功后跳转到 `/keystatic` 页面立即又跳回 `/login`。

**原因**:

1. 所有 42 个 admin 页面的 frontmatter 调用 `Astro.redirect('/login')`，构建时 `Astro.cookies.get()` 返回 `undefined` → session 为 `null` → 触发重定向（构建时无意义，但运行时逻辑错误）
2. `ks-admin-session` cookie 设置了 `HttpOnly`，前端 `document.cookie` 无法读取

**修复**:

1. 移除所有 admin 页面的 `Astro.redirect('/login')`，改用 `AdminLayout` 的 client-side 脚本检查
2. Worker 登录时额外设置一个非 HttpOnly 的 companion cookie `ks-auth=1`
3. `AdminLayout.astro` 的 `<script is:inline>` 检查 `document.cookie.indexOf('ks-auth=')`：

```js
(function () {
  if (document.cookie.indexOf('ks-auth=') === -1 && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
})();
```

**避免方法**:

- Admin 页面不要使用 `Astro.redirect('/login')`（构建时运行，cookie 不可用）
- 使用 client-side cookie 检查 + companion cookie 方案
- 登录 cookie 同时设置 HttpOnly（安全）和非 HttpOnly（前端可用）两个版本

### 11.12 价格信息意外显示

**要求**: 产品页面上不允许显示价格 (B2B 要求)。

**已移除**:

- 所有产品详情页的价格显示
- 所有产品对比页的"价格"比较行
- 产品卡片上的价格徽章
- AI 对话中的价格引用文本
- JSON-LD Schema 中的 `offers.price` 字段

**如果将来要添加价格显示**: 需要在 `src/data/products.ts` 添加价格字段, 并在产品页面模板中对应渲染。

### 11.17 YAML.stringify 全文件重写导致大面积 diff

**现象**: 用 `yaml` 包 `parse` → 改一个值 → `stringify` 回写后, 单文件 diff 达 136-162 行, git 历史被无关的折行/引号风格重排污染。

**原因**: `YAML.stringify` 按 lineWidth 重新折行并重选引号风格, 与仓库手工维护的原始 YAML 排版不一致。

**正确做法**: 对源 YAML 做引号感知的**原始文本靶向替换** (`tools/i18n-apply.mjs` 即此实现), 每次替换后 `YAML.parse` 重读并 deep-equal 校验语义, 落盘保持最小 diff。验收标准: `git diff --stat` 的 +N/−N 恰好等于替换条数。

### 11.18 YAML plain scalar 引号规则 (YAMLParseError: Unexpected alias)

**现象**: 写入以 `*` 或 `**` 开头的值 (如 `**Heavy-Duty**` 翻译) 后, 构建报 `YAMLParseError: Unexpected alias`。

**原因**: YAML 中 `*` 开头的 plain scalar 被解析为别名引用 (alias)。

**规则** (`tools/yaml-set.mjs` 的 `plainSafe()` 已内置):

| 值的特征                  | 存储形式          |
| ------------------------- | ----------------- |
| 安全的 plain scalar       | 原样              |
| 以 `*` / `&` 开头或含 `'` | 单引号包裹        |
| 含 `"` 或反斜杠           | 双引号包裹 + 转义 |
| 以 `:` 结尾或含 ` #`      | 引号包裹          |

### 11.19 git push TLS 连接被重置

**现象**: `git push origin main` 报 `OpenSSL SSL_read: Connection was reset` 或无法连接 github.com。

**修复**:

```bash
ipconfig /flushdns                            # GitHub DNS 解析经常劣化, 先刷新
git -c http.version=HTTP/1.1 push origin main # 强制 HTTP/1.1 绕开 HTTP/2 帧错误
```

### 11.20 PowerShell/Node 环境陷阱 (Windows)

| 陷阱                                   | 后果                 | 正确做法                                                     |
| -------------------------------------- | -------------------- | ------------------------------------------------------------ |
| `Get-Content`/`Set-Content` 读写源文件 | 非 ASCII 变 mojibake | 只用编辑工具或 Node 脚本 (`fs.readFileSync`/`writeFileSync`) |
| 路径含 `[lang]` 字面量                 | 被当通配符解析报错   | 一律 `-LiteralPath`                                          |
| `node -e "..."` 内嵌引号/撇号          | 解析失败             | 写成 .mjs 文件再执行                                         |
| 控制台输出非 ASCII                     | 显示乱码但内容正常   | 以 `git diff` / 文件内容为准, 勿信控制台显示                 |

### 11.21 多语言批量替换的三个历史 bug + MT 红线

applier (`tools/i18n-apply.mjs`) 开发中实际踩过的坑:

1. `**` 开头的替换值必须按引号规则包裹 (见 11.18)
2. 替换目标本身已在引号上下文中时, 不能重复加引号: `quoteSingle(t).slice(1, -1)`
3. 保留原文闭合引号: `raw.slice(end)` 而非 `raw.slice(end + 1)`

**机器翻译 (MT) 红线 — 每批替换前必须自查** (全部实际发生过):

- 跨语言词汇泄漏 (瑞典语混入荷兰语 "Tweemotoralternativ")
- 幻觉词 (荷兰语 "Uitruilingsfaulten" 不存在)
- 性/数一致性错误 (sv/pl/ru)
- 航海术语错误 ("korpherrar"→"knapar", "innemende zee"→"over het dek slaande zee")

**遗漏教训**: applier 以 fr 泄漏集为规范序列 — 某语言独有、但 fr 中已是译文的 EN 值不会被匹配 (offshore 的 sv/no items 标题即此情形) → 替换后必须复扫 + 人工核查剩余 EN。

### 11.22 compare 自动页面: 225 个空 noindex 页 (既有站内 bug)

`src/pages/[lang]/compare/[slug].astro` 为 15 对 × 15 语言生成 225 个空页面 (`page=null`, noindex)。这是英文侧既有的站内 bug, 不属于 i18n 泄漏范围 → 扫描 dist 时必须排除 8 个显式 compare 路由 (aluminum-vs-fiberglass 等) 之外的全部 compare 路径。`tools/i18n-endiff.mjs` 已内置该排除逻辑。

### 11.23 机器可读字段保持英文 (审计白名单)

审计扫描时以下字段命中 EN 值属于**设计如此**, 不要"修复": JSON-LD、meta、image alt、href/slug、`.source` 路由、公司名 (`customer`/`company` 键)、邮寄地址、`color`/`badge` class、认证代号 (CE/ISO/USCG)、测试标准 (`standard` 键, 如 ASTM D751)、对比矩阵规格单元格 (`premium` 键)、阀门品牌名 (Halkey-Roberts/Leafield/Boston)、真实地名、产品型号 (如 RIB 600 Patrol)、`custom.yaml` 的 `hero.tagline` ("Inflatable Pool Factory Custom Lab")。完整键名排除表见 `tools/i18n-audit.mjs` 的 `NOISE_KEY`, 字面值排除表见同文件的 `MACHINE_VALUES`。

---

## 12. 编辑指南与红线

### 12.1 翻译相关

- **✅ 使用**: `getUiForLang(lang)` 从 `~/i18n/generated/ui-all` 导入
- **❌ 禁止**: 从 `~/i18n/config` 导入 `ui` 并使用 `(ui as any)`
- **❌ 禁止**: 使用 `(ui as any)[key]` 或 `(ui)[key]` 模式
- **✅ 推荐模式**: `const t = (key: string) => getUiForLang(locale)?.[key] || key;`

### 12.2 产品相关

- 产品结构化数据在 `src/data/products.ts` 修改
- 产品多语言文本在 `src/data/product-texts.ts` 修改
- Tags 渲染必须使用安全展开, 不能直接渲染对象
- 不要在产品页面上添加价格信息

### 12.3 导航项修改红线

添加或修改导航项时，必须同步更新以下**六处**:

| #   | 文件                                  | 修改内容                                                 |
| --- | ------------------------------------- | -------------------------------------------------------- |
| 1   | `src/data/site/navigation.yaml`       | 添加/修改导航结构和英文 text                             |
| 2   | `src/components/widgets/Header.astro` | 在 `navTextMap` 添加 text → 翻译键映射                   |
| 3   | `src/components/widgets/Footer.astro` | 同上，在 `navTextMap` 添加映射                           |
| 4   | `public/data/i18n-config.json`        | 为所有 15 语言添加翻译键和翻译文本                       |
| 5   | `node scripts/_gen-uiall.cjs`         | 重新生成 UI .ts 文件（修改 i18n-config.json 后必须运行） |
| 6   | `src/i18n/routing.ts`                 | 如果新页面在 `[lang]/` 下，添加到 `LOCALIZED_ROUTES`     |
| 7   | `src/lib/geo-seo/intent.ts`           | 为新页面添加 `aboutMap` + `intentRules` 条目             |

**❌ 不要**只修改 `navigation.yaml` 或本地化 YAML 文件（如 `navigation.zh.yaml`）——渲染系统不使用它们进行翻译。

**✅ 验证方法**: `git grep 'New Text'` 检查是否在所有必要文件中出现。新页面路径应同时在 routing.ts 和 intent.ts 中注册。

### 12.4 文件编码

- 所有源文件必须使用 **UTF-8 without BOM**
- 修改包含中文/非 ASCII 字符的文件后, 运行 `python scripts/check-encoding.py`
- 如果发现乱码, 运行 `python scripts/fix-garbled.py`

### 12.4 Worker 限制

- 每个 Worker 的 JS 编译后必须 **< 3 MB**
- 不要在 Worker 中 `import` Astro 项目 `src/` 目录的文件
- Worker 使用独立的 `wrangler.toml` 配置

### 12.5 R2 资产

- 静态图片/文件上传到 R2 后, 通过 `https://assets.inflatablepoolfactory.com/...` 访问
- 上传命令: `node scripts/fast-upload-r2.mjs`
- `functions/_middleware.ts` 自动将 `/images/*` 和 `/files/*` 重定向到 R2

### 12.6 构建与部署

- 修改前务必运行 `npm run build` 确认构建成功
- 构建成功后部署: `npx wrangler pages deploy dist/`
- 如果修改了 Worker, 单独部署: `npm run deploy:worker-<name>`
- 如果修改了资产文件, 上传 R2: `node scripts/fast-upload-r2.mjs`

### 12.7 修改后验证清单 (参考 TROUBLESHOOTING.md §6)

每次修改后，始终验证：

1. `node i18n-tool.cjs check` 通过
2. `npx esbuild src/i18n/config.ts --bundle --format=esm --outfile=NUL` 通过
3. `node scripts/geo-build.mjs` 通过
4. `npm run build` 构建成功
5. 视觉检查：主页、博客、暗模式、移动菜单、联系表单

### 12.8 添加新内容清单 (参考 TROUBLESHOOTING.md §8)

**新产品:**

1. 在 `src/data/products.ts` 添加产品数据
2. 在 `src/content/products/{slug}.mdx` 创建 MDX
3. 在 `src/data/product-texts.ts` 添加翻译
4. → 自动生成：产品页面、`/llms/products/{slug}`、JSON-LD、llms.txt

**新本地化页面 (15语言):**

1. 在 `src/pages/[lang]/{slug}.astro` 创建页面
2. 在 `src/i18n/config.ts` 添加翻译键
3. 在 `src/data/site/sections.ts` 添加条目
4. 在 `src/lib/geo-seo/intent.ts` 添加意图规则
5. → 自动生成：HTML 页面、llms.txt、llms-full.txt、站点地图

**新 B2B 页面:**

1. 在 `src/pages/{slug}.astro` 创建页面（根级，英语）
2. 在 `src/data/standalone-pages.ts` 添加元数据
3. 在 `src/data/site/sections.ts` 添加条目
4. → 自动生成：HTML 页面、`/llms/pages/{slug}`、llms.txt、站点地图

**新 Solutions 页面 (带多语言):**

1. 在 `src/data/pages/solutions-{slug}.yaml` 创建 YAML 数据（hero, solution_offerings, benefits, cta）
2. 在 `src/pages/solutions/{slug}.astro` 创建根级页面（使用 `getPageContent('en', 'solutions-{slug}')`）
3. 在 `src/pages/[lang]/solutions/{slug}.astro` 创建本地化页面（15 语言, `getStaticPaths`）
4. 在 `src/i18n/routing.ts` 的 `LOCALIZED_ROUTES` 中添加路径
5. 在 `src/lib/geo-seo/intent.ts` 添加 `aboutMap` + `intentRules` 条目
6. 在 `src/data/site/navigation.yaml` 添加导航项
7. → 自动构建: 15 语言 HTML 页面, JSON-LD, ai-intent meta, llms.txt

**新 Industries Landing Pages (行业页面):**
与 Solutions 页面相同的数据驱动模式，URL 路径为 `/industries/{slug}`:

1. 创建 `src/data/pages/industries-{slug}.yaml` (数据)
2. 创建 `src/pages/industries/{slug}.astro` (根级)
3. 创建 `src/pages/[lang]/industries/{slug}.astro` (本地化)
4. 注册 routing.ts + intent.ts
5. 示例: `industries-schools.yaml` → `/industries/schools`

### 12.9 代码检查

```bash
npm run check          # 全部检查 (astro + eslint + prettier + i18n)
npm run check:astro    # 仅 astro check
npm run check:eslint   # 仅 eslint
npm run check:prettier # 仅 prettier
npm run check:i18n     # 仅 i18n 翻译检查
```

---

## 13. 附录: 关键文件引用

| 文件                                     | 用途                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `src/i18n/generated/ui-all.ts`           | `getUiForLang()` 函数 (翻译入口)                                       |
| `src/i18n/config.ts`                     | `setLang()`, `defaultLang`, 语言列表                                   |
| `src/i18n/utils.ts`                      | `getLangFromUrl()`, 路径处理                                           |
| `src/i18n/page-content.ts`               | `getPageContent()` 页面内容                                            |
| `src/i18n/generated/site-data.ts`        | `site-*` 键构建产物 (2.2 MiB, [lang]/ 页面直接 import)                 |
| `src/i18n/generated/pages/*.ts`          | 每页一个 TS 模块 (~110 个, 构建期生成)                                 |
| `scripts/generate-data-json.mjs`         | i18n 构建数据生成 (page-content.json + site-data.ts, content-v2* 排除) |
| `scripts/patch-worker.mjs`               | ⚠️ 历史遗留 (server 模式子域路由), static 下不执行, 勿改勿用           |
| `src/data/products.ts`                   | 产品结构化数据                                                         |
| `src/data/product-texts.ts`              | 产品多语言文本                                                         |
| `src/layouts/Layout.astro`               | 主布局 (调用 setLang)                                                  |
| `src/components/widgets/Header.astro`    | 导航栏 (getUiForLang)                                                  |
| `src/components/widgets/Footer.astro`    | 页脚 (getUiForLang)                                                    |
| `src/pages/[lang]/products/[slug].astro` | 多语言产品详情                                                         |
| `src/pages/products/[slug].astro`        | 英语产品详情                                                           |
| `functions/_middleware.ts`               | Pages Functions 中间件                                                 |
| `src/middleware.ts`                      | Astro 中间件                                                           |
| `wrangler.toml`                          | R2 bucket 声明                                                         |
| `src/i18n/routing.ts`                    | 共享路由模块 (`LOCALIZED_ROUTES`, `localizeHref()`, `entityForHref()`) |
| `src/utils/images.ts`                    | 图片处理 (`adaptOpenGraphImages()` — 远程 URL 跳过 `getImage()`)       |
| `scripts/_gen-uiall.cjs`                 | UI 翻译生成脚本                                                        |
| `scripts/_gen-pages.cjs`                 | 页面内容 TS 模块生成脚本                                               |
| `scripts/check-translations.mjs`         | 翻译检查脚本                                                           |
| `src/lib/token-store.ts`                 | GitHub Token 的 cookie 加密/解密/读取                                  |
| `src/lib/auth.ts`                        | legacy HMAC 会话校验 (better-auth 迁移后的兼容回退)                    |
| `src/lib/github.ts`                      | `GitHubClient` 封装 GitHub REST API                                    |
| `src/layouts/AdminLayout.astro`          | 后台布局：侧边栏导航 + client-side 登录检查                            |
| `workers/admin-worker/index.ts`          | 后台 Worker：better-auth、GitHub 代理、Token 保存、D1 查询             |
| `workers/shared/auth.ts`                 | better-auth 共享配置 (插件/角色/OAuth 提供商)                          |
| `src/pages/keystatic/`                   | 44 个 CMS 编辑页面 (顶层 29 + 5 个集合子目录)                          |
| `src/data/admin-auth.json`               | ⚠️ legacy 硬编码凭据回退（better-auth 已取代，不建议继续使用）         |

---

## 14. 后台管理系统架构

### 14.1 概述

后台管理系统位于 `/keystatic/*` 路由，提供 CMS 功能（编辑产品、文章、页面、导航等）。系统采用 **静态构建 + Worker API 的混合架构**：

- **前端**: Astro 静态页面 (`output: 'static'`)，所有 admin 页面在构建时预渲染
- **API**: Cloudflare Worker (`inflatable-pool-factory-admin`) 处理认证、GitHub 读写、D1 查询
- **认证**: better-auth（Google OAuth + 邮箱密码，D1 会话，Turnstile 验证码）
- **存储**: 内容读写 GitHub 仓库（REST API，draft 分支编辑 → publish 合并）；提交记录/用户会话存 D1

### 14.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                   浏览器 (Browser)                        │
│   /keystatic/*   ←  Astro 静态页面 (预渲染)              │
│   /login         ←  登录页面 (better-auth + Turnstile)   │
│   /api/auth/*    ←  better-auth 端点                     │
│   /api/admin/*   ←  fetch → Worker API                   │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────────┐
│  Cloudflare Pages │    │  Cloudflare Worker       │
│  dist/ (静态文件)  │    │  inflatable-pool-factory-admin         │
│                   │    │                          │
│  /keystatic/*     │    │  better-auth (D1 会话)   │
│  /login           │    │  /api/admin/list         │
└──────────────────┘    │  /api/admin/read          │
                         │  /api/admin/update        │
                         │  /api/admin/publish       │
                         │  /api/admin/inquiries     │
                         │  /api/admin/refactor/*    │
                         └───────────┬──────────────┘
                                     │
                    ┌────────────────┴───────────────┐
                    ▼                                ▼
        ┌────────────────────────┐      ┌────────────────────┐
        │  GitHub REST API        │      │  D1 (inflatable-pool-factory-db)  │
        │  api.github.com         │      │  user/session/      │
        │  GET/PUT/POST contents  │      │  account/verification│
        │  POST merges (draft→main)│      │  inquiry (提交记录)  │
        └────────────────────────┘      └────────────────────┘
```

### 14.3 认证流程 (better-auth)

#### 14.3.1 登录

```
用户在 /login 选择 Google OAuth 或输入邮箱+密码（+ Turnstile 验证码）
  │
  ▼
POST /api/auth/* (better-auth, 由 admin-worker 提供)
  │
  ├─ Google OAuth 回调 → 创建/查找用户 → 建立会话
  ├─ 邮箱+密码 → 校验密码 → 建立会话
  │
  ├─ 会话存储: D1 session 表 (drizzleAdapter)
  ├─ 会话 cookie: csr_session (HttpOnly, Secure)
  ├─ 角色判定: isAdminEmail(email, ADMIN_EMAILS) → admin / user
  │   (admin 角色通过 better-auth admin 插件授予)
  │
  └─ 成功后前端跳转 /keystatic
```

#### 14.3.2 认证检查

- **构建时**: `Astro.cookies.get()` 返回空 → 所有 admin 页面预渲染为空壳
- **运行时 (浏览器)**:
  - `AdminLayout.astro` 的 inline script 检查登录状态（client-side），未登录 → `window.location.replace('/login')`
  - Worker API 请求通过 better-auth cookie 认证；`workers/shared/assert-admin.ts` 校验 admin 角色
  - 内容编辑目标分支为 `draft`，发布时 `POST /api/admin/publish` 合并到 `main`

#### 14.3.3 登出

```
GET /api/auth/sign-out (better-auth)
  → 删除 D1 session 行 + 清除 csr_session cookie
```

### 14.4 GitHub Token 管理

#### 14.4.1 Token 保存流程

```
用户在 /keystatic/github-token 输入 PAT → 提交
  │
  ├─ 1. POST /api/admin/save-token { token }
  │     Worker 验证格式 (ghp_ 或 github_pat_ 开头)
  │     Worker 设置 cookie: ks-gh-token={encodeURIComponent(token)}
  │     返回 { success: true }
  │
  ├─ 2. 前端 JS 额外保存到 localStorage: ks-gh-token
  │
  └─ 3. 页面重定向到 /keystatic
```

#### 14.4.2 Token 读取流程

```
Astro 页面 frontmatter → readTokenFromCookies(Astro.cookies)
  │
  ├─ 1. 读取 cookie 'ks-gh-token' 的原始值
  ├─ 2. 尝试 AES-256-GCM 解密（兼容 Node.js saveTokenCookie 加密格式）
  ├─ 3. 解密失败 → 尝试 decodeURIComponent（兼容 Worker 明文格式）
  └─ 4. 返回 token 字符串 或 null
```

#### 14.4.3 两套存储路径

| 路径           | 设置方式                                | 格式                         | 适用场景             |
| -------------- | --------------------------------------- | ---------------------------- | -------------------- |
| **Worker API** | `POST /api/admin/save-token`            | 明文 + `encodeURIComponent`  | 浏览器端操作         |
| **Node.js**    | `saveTokenCookie()` in `token-store.ts` | AES-256-GCM 加密 + base64url | 构建时/SSR（未使用） |

> ⚠️ `readTokenFromCookies()` 必须兼容两种格式。

### 14.5 GitHub API 调用

`GitHubClient` (`src/lib/github.ts`) 封装所有 GitHub REST API 调用：

```
GitHubClient(token)
  │
  ├─ verifyToken()        → GET /user               (验证 token 有效性)
  ├─ listFiles(dirPath)   → GET /repos/*/contents/*  (列出目录文件)
  ├─ readFile(filePath)   → GET /repos/*/contents/*  (读取文件内容)
  ├─ createFile(...)      → PUT /repos/*/contents/*  (创建文件)
  ├─ updateFile(...)      → PUT /repos/*/contents/*  (更新文件)
  ├─ deleteFile(...)      → DELETE /repos/*/contents/* (删除文件)
  └─ getRecursiveTree()   → GET /repos/*/git/trees/* (获取完整目录树)
```

**工作原理**:

- 每个 admin 页面在 frontmatter 中创建 `GitHubClient(token)` 实例
- 页面使用 `readFile()` 从 GitHub 加载当前内容
- 用户编辑后，表单通过 fetch POST 到 Worker `/api/admin/update`
- Worker 使用 `GITHUB_TOKEN` (环境变量) 将更新提交到 GitHub

### 14.6 页面结构

#### 14.6.1 Admin 页面列表 (44 个页面)

```
src/pages/keystatic/
├── index.astro                     # Dashboard
├── about.astro                     # About 页面内容 (15 语言)
├── branding.astro                  # 品牌/Logo/联系信息 (15 语言)
├── categories.astro                # 产品分类 (15 语言)
├── contact-form-text.astro         # 联系表单文字配置 (15 语言)
├── content-v2.astro                # 内容 V2 库 (15 语言)
├── countries.astro                 # 国家/地区配置 (15 语言)
├── evidence.astro                  # 案例证据 (15 语言)
├── faqs.astro                      # FAQ (15 语言)
├── github-token.astro              # GitHub Token 管理
├── hero-images.astro               # Hero 图片 (15 语言)
├── inquiries.astro                 # 联系表单提交记录 (D1, /api/admin/inquiries)
├── languages.astro                 # 语言管理
├── learning-center.astro           # 学习中心 (15 语言)
├── link-refactor.astro             # 链接重构工具 (URL/名称批量改名)
├── navigation.astro                # 导航管理 (15 语言, 变更检测 → 重命名横幅)
├── news.astro                      # 新闻撰写 (写入 D1 news 表)
├── product-visuals.astro           # 产品图片映射 (15 语言)
├── proof-points.astro              # 营销数据点 (15 语言)
├── research.astro                  # 研究内容 (15 语言)
├── seo.astro                       # SEO 设置 (15 语言)
├── tech-cards.astro                # 技术卡片 (15 语言)
├── testimonials.astro              # 客户推荐 (15 语言)
├── top-guides.astro                # 顶部指南 (15 语言)
├── trust-badges.astro              # 信任徽章 (15 语言)
├── trust-bar.astro                 # 信任栏 (15 语言)
├── use-cases.astro                 # 用例 (15 语言)
├── users.astro                     # 用户管理 (better-auth admin 插件)
├── validate-links.astro            # 链接验证 (只读全站 href 扫描)
│
├── posts/
│   ├── index.astro                 # 文章列表
│   ├── new.astro                   # 新建文章
│   └── [slug].astro                # 编辑文章 (15 语言)
├── products/
│   ├── index.astro                 # 产品列表
│   ├── new.astro                   # 新建产品
│   └── [slug].astro                # 编辑产品 (15 语言, ProductForm 内嵌语言选择)
├── pages/
│   ├── index.astro                 # 页面列表
│   ├── new.astro                   # 新建页面
│   └── [slug].astro                # 编辑页面 (15 语言)
├── case-use/
│   ├── index.astro                 # 案例列表
│   ├── new.astro                   # 新建案例
│   └── [slug].astro                # 编辑案例 (15 语言)
├── technology/
│   ├── index.astro                 # 技术文章列表
│   ├── new.astro                   # 新建技术文章
│   └── [slug].astro                # 编辑技术文章 (15 语言)
```

> 标记 `(15 语言)` 的页面支持全 15 种语言的翻译编辑。语言通过 `?locale=` 查询参数切换。

#### 14.6.2 i18n-admin 工具库

`src/lib/i18n-admin.ts` 提供多语言编辑所需的常量和路径工具：

```typescript
export const ADMIN_LOCALES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  it: 'Italiano',
  ru: 'Русский',
  pl: 'Polski',
  nl: 'Nederlands',
  sv: 'Svenska',
  no: 'Norsk',
  el: 'Ελληνικά',
  fi: 'Suomi',
  da: 'Dansk',
};
export const ADMIN_LOCALE_CODES = Object.keys(ADMIN_LOCALES);
export function siteFileForLocale(basePath: string, locale: string): string;
export function pageFileForLocale(slug: string, file: string, locale: string): string;
export function contentFileForLocale(basePath: string, locale: string): string;
```

**文件命名约定：**

- 站点内容：`about.yaml` → `about.zh.yaml` (后缀式)
- 集合条目：`foo.md` → `foo.zh.md` (后缀式)
- 静态页面：`privacy.yaml` → `zh/privacy.yaml` (子目录式)

#### 14.6.3 每个页面的标准结构 (15 语言版)

```astro
---
// 1. import
import AdminLayout from '~/layouts/AdminLayout.astro';
import { ADMIN_LOCALES, ADMIN_LOCALE_CODES, siteFileForLocale } from '~/lib/i18n-admin';
import { verifySessionToken } from '~/lib/auth';
import { readTokenFromCookies } from '~/lib/token-store';
import { GitHubClient, getRepoInfo } from '~/lib/github';
export const prerender = true;

// 2. 区域设置检测
const locale = (Astro.url.searchParams.get('locale') || 'en').toLowerCase();
const isDefault = locale === 'en';
const file = siteFileForLocale('src/data/site/about.yaml', locale);

// 3. 加载内容（含英文回退）
const session = Astro.cookies.get('ks-admin-session')?.value;
const verified = session ? verifySessionToken(session) : null;
const token = readTokenFromCookies(Astro.cookies);
let data = {};
let sha = '';
if (token) {
  try {
    const client = new GitHubClient(token);
    let f;
    try {
      f = await client.readFile(file, 'draft');
    } catch {
      try {
        f = await client.readFile(file);
      } catch {
        if (!isDefault) {
          f = await client.readFile('src/data/site/about.yaml');
        }
      }
    }
    if (f) {
      data = load(f.content);
      sha = f.sha;
    }
  } catch (err) {
    loadError = err.message;
  }
}
---

<AdminLayout title="..." active="...">
  <!-- 4. 语言切换器 + 文件路径 -->
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h1 class="text-2xl font-semibold">...</h1>
    <select id="locale-select">
      {
        ADMIN_LOCALE_CODES.map((l) => (
          <option value={l} selected={l === locale}>
            {ADMIN_LOCALES[l]}
          </option>
        ))
      }
    </select>
  </div>

  <!-- 5. 编辑表单 -->
  <form data-locale={locale}>...</form>

  <script is:inline>
    // 6. 语言切换导航
    document.getElementById('locale-select')?.addEventListener('change', function () {
      var loc = this.value;
      var base = window.location.pathname;
      window.location.href = loc === 'en' ? base : base + '?locale=' + loc;
    });
    // 7. 表单提交逻辑
  </script>
</AdminLayout>
```

> 区域设置文件加载优先级：`draft` 分支 → `main` 分支 → 英文源文件（仅非英文区域设置回退）

### 14.7 Worker API 端点总览

| 端点                        | 方法 | 认证                            | 用途                                 |
| --------------------------- | ---- | ------------------------------- | ------------------------------------ |
| `/api/auth/*`               | ALL  | better-auth                     | 登录/登出/会话 (Google OAuth + 邮箱) |
| `/api/admin/list`           | GET  | better-auth cookie              | 列出目录文件                         |
| `/api/admin/read`           | GET  | better-auth cookie              | 读取文件 (frontmatter/yaml)          |
| `/api/admin/create`         | POST | better-auth cookie              | 创建文件 (draft 分支)                |
| `/api/admin/update`         | POST | better-auth cookie              | 更新文件 (draft 分支, 支持 YAML)     |
| `/api/admin/delete`         | POST | better-auth cookie              | 删除文件                             |
| `/api/admin/publish`        | POST | better-auth cookie + admin 角色 | 合并 draft → main                    |
| `/api/admin/save-token`     | POST | better-auth cookie              | 保存 GitHub Token 到 cookie          |
| `/api/admin/inquiries`      | GET  | better-auth cookie + admin 角色 | 读取 D1 联系提交 (最新 50 条)        |
| `/api/admin/inquiries.csv`  | GET  | better-auth cookie + admin 角色 | 导出全部提交为 CSV                   |
| `/api/admin/refactor/scan`  | POST | better-auth cookie + admin 角色 | 链接重构扫描 (预览 diff)             |
| `/api/admin/refactor/apply` | POST | better-auth cookie + admin 角色 | 链接重构逐文件提交                   |

### 14.8 Cookie 清单

| Cookie 名     | HttpOnly | 用途                                     | 设置者               | 过期           |
| ------------- | -------- | ---------------------------------------- | -------------------- | -------------- |
| `csr_session` | ✅ 是    | better-auth 会话 token (Worker API 认证) | Worker (better-auth) | 30 天 (可配置) |
| `ks-gh-token` | ❌ 否    | GitHub Personal Access Token             | Worker               | 30天           |

> 旧版 `ks-admin-session` (HMAC) 和 `ks-auth` 标记 cookie 已随 better-auth 迁移退役（`src/lib/auth.ts` 保留兼容回退）。

### 14.9 关键依赖关系

```
src/lib/token-store.ts
  ├─ node:crypto (createHash, createCipheriv, createDecipheriv) — AES-256-GCM
  ├─ SESSION_SECRET / KEYSTATIC_SECRET — 加密密钥
  └─ 被所有 keystatic/*.astro 页面引用

workers/shared/auth.ts
  ├─ betterAuth() — 主认证配置 (secret, baseURL, drizzleAdapter(D1))
  ├─ admin 插件 — 用户/会话管理 (ban, impersonate, list)
  ├─ captcha 插件 — Turnstile
  ├─ adminAc (access control) — 角色权限
  └─ socialProviders() — Google / GitHub OAuth

workers/shared/client.ts / schema.ts
  ├─ drizzle ORM + D1 数据库连接
  └─ 表: user, session, account, verification, inquiry, news, rateLimit

workers/shared/assert-admin.ts
  └─ isAdminEmail() + 会话校验 → 403 拦截非管理员请求

workers/admin-worker/index.ts
  ├─ better-auth handler (/api/auth/*)
  ├─ handleAdmin() — 所有 /api/admin/* 路由 (GitHub CRUD + D1 查询 + refactor)
  └─ handleInquiries() — D1 inquiry 读取/CSV 导出

src/layouts/AdminLayout.astro
  ├─ 侧边栏导航 (30+ 入口)
  ├─ 登录检查 (client-side, 跳转 /login)
  ├─ 暗模式 / 移动端支持
  └─ Toast 通知系统
```

### 14.10 公众站点区域设置内容加载

公众站点的非英文页面（`[lang]/*.astro`）通过构建时生成的 JSON 加载区域设置感知的内容：

**页面内容**（`src/data/pages/{locale}/{page}.yaml`）：

- 构建时由 `scripts/generate-data-json.mjs` 处理 → `page-content.json`
- 每页导入 `generated/pages/{name}.ts` → `getPageContent(lang, 'page')`
- 区域设置文件不存在时跳过（不降级到英文）

**站点内容**（`src/data/site/*.yaml`）：

- 构建时同样由 `generate-data-json.mjs` 处理，键为 `{lang}/site-{name}`
- 页面通过 `import { pageContentData } from '~/i18n/generated/site-data'` 访问
- 访问模式：`pageContentData[\`${lang}/site-about\`] || pageContentData['en/site-about'] || {}`
- 区域设置文件不存在时自动降级到英文

**构建管线：**

```
generate-data-json.mjs
  ├─ generateI18nConfig()   → i18n-config.json (UI 字符串, 15 语言)
  ├─ generatePageContent()   → page-content.json (页面 + 站点内容)
  │    ├─ src/data/pages/{locale}/{page}.yaml    → {lang}/{page}
  │    └─ src/data/site/{name}.{locale}.yaml      → {lang}/site-{name}
  └─ writeSiteDataTs()        → site-data.ts (仅 site-* 键)
         ↓
_gen-pages.cjs → generated/pages/{name}.ts (每页一个分片)
_patch-pages.cjs → 自动注入 import/setter 到 [lang]/ 页面
```

**回退行为：** 当 `{lang}/site-about` 在 page-content.json 中不存在时：

1. 检查 `en/site-about`（英文源文件）
2. 如果也不存在，返回 `{}`（空对象）

---

## 15. 多语言批量编辑工具 (tools/)

> **铁律: 对 36 个非英语言副本的任何页面文案增删改, 必须走批量脚本, 禁止手工逐文件编辑。**
> 脚本存放于仓库 `tools/`, 随代码一起提交推送; 用法或结构变更时, 必须同步更新本节 (维护规则见 §15.6)。

### 15.1 工具清单

| 脚本                   | 用途                                          | 用法                                       |
| ---------------------- | --------------------------------------------- | ------------------------------------------ |
| `i18n-audit.mjs`       | 全站 EN 泄漏审计 → `tools/_work/audit.json`   | `node tools/i18n-audit.mjs [base.yaml]`    |
| `i18n-apply.mjs`       | 按翻译表批量替换页面 YAML                     | `node tools/i18n-apply.mjs <base> [--dry]` |
| `yaml-set.mjs`         | 通用批量 set/delete (spec.json 驱动)          | `node tools/yaml-set.mjs <spec> [--dry]`   |
| `i18n-endiff.mjs`      | dist 产物 h1/title 英文残留扫描               | `node tools/i18n-endiff.mjs`               |
| `i18n-verify-home.mjs` | 14 语言首页译文完整性验证                     | `node tools/i18n-verify-home.mjs`          |
| `i18n-wordcount.mjs`   | 页面字数统计 (SEO 索引阈值校验)               | `node tools/i18n-wordcount.mjs <route...>` |
| `ui-seed.mjs`          | 新语言导航 UI 键种子注入 i18n-config.json     | `node tools/ui-seed.mjs <lang>`            |
| `page-seed.mjs`        | EN 页面 YAML 复制到语言目录 (门槛文件/预翻译) | `node tools/page-seed.mjs <lang> <page>…`  |

目录约定:

- `tools/l10n/` — 翻译表 (`<base>.<lang>.json`), i18n-apply 的输入, 随仓库提交
- `tools/_work/` — 运行产物 (audit.json、临时 spec), 自带 `.gitignore` 全忽略, 不提交

### 15.2 标准工作流 (修复一个页面的泄漏)

```
1. node tools/i18n-audit.mjs <base>.yaml      # 生成泄漏清单 (fr 为规范序列)
2. 人工翻译 → tools/l10n/<base>.<lang>.json   # { "yaml路径": "译文", ... }
3. node tools/i18n-apply.mjs <base> --dry     # 预览计数
4. node tools/i18n-apply.mjs <base>           # 应用 + 重读校验
5. git diff --stat 校验 +N/−N == 替换数; grep 剩余 EN → 手工补漏 (见 11.21)
6. node tools/i18n-audit.mjs <base>.yaml      # 复扫, 期望 0
```

### 15.3 i18n-audit.mjs

- 扫描 `src/data/pages/<lang>/*.yaml`, 与 EN 源逐路径对比, 值完全相等且不命中 NOISE_KEY 的计为泄漏
- 输出 `tools/_work/audit.json`: `perLang[lang][file]` 与 `perFile[file][lang]` 双索引, 每条 `{ path, v }`
- NOISE_KEY 排除键: icon/href/link/url/src/alt/file/image/cta_href/amount/logo/video/photo/email/phone/whatsapp/sku/code/id/source/address/company/color/badge/location/imageAlt/slug (机器字段, 见 11.23)
- LANGS 现为 36 个非英语言 (14 既有 + 19 新增 + 6 扩充 − 3 删除, 见 §16.6); 无语言目录的语言自动 0 泄漏
- 当前基线: 7,438 (2026-09-23, 14 语言口径, solutions-watersports + solutions-offshore-energy 清零后); 19 新语言的 home 清零后, about/contact/news 为有意 EN 副本 (预期泄漏队列, 见 §16)

### 15.4 i18n-apply.mjs

- 读取 `tools/_work/audit.json` + `tools/l10n/<base>.<lang>.json`, 对源 YAML 做引号感知的原始文本替换 (见 11.17/11.21)
- 字面块 (`|`) 多行值: 解析值的 `\n` 在原始文本中是 `\n+缩进`, 用缩进感知正则定位、按同缩进回写 (home.yaml hero.subtitle / blog_latest.information 即此情形); 折叠块 (`>`) 与流式多行安全跳过 (计数不匹配 → skip)
- 规范序列: `leaks.fr || Object.values(leaks)[0]`; 当前值 ≠ EN 的路径跳过 (保留既有译文, 如 de "Flottenpreis anfordern")
- 每文件替换后 `YAML.parse` 重读 + JSON deep-equal 校验; `--dry` 只打印计数不落盘
- 遗漏教训: 语言独有 EN 值不在 fr 规范集内会漏替换 → 复扫 + 手工补 (见 11.21)

### 15.5 yaml-set.mjs

spec.json 驱动的通用批量编辑器, 适合"同一改动跨多语言"的场景 (统一措辞、改标题、删字段):

```json
{
  "base": "solutions-watersports",
  "langs": ["sv", "no"],
  "set": { "hero.tagline": "value" },
  "setPerLang": { "fr": { "hero.title": "Titre" } },
  "delete": ["content_segments.items[2]"],
  "includeEn": true
}
```

安全模型 (v1 设计边界):

- `set`: 旧值必须是该文件内**唯一**字符串叶节点, 否则整文件 ABORT (改用 `setPerLang` 精确定位)
- 不支持新增路径; `delete` 仅限标量叶 (整行删除); flow-style 行安全中止
- 每文件写前 full reparse + JSON deep-equal 对照期望树, 不一致即回滚不落盘
- 结构性块增删 (数组整块、新 section): 复制本脚本引擎写一次性脚本, 用后弃置 (不入 tools/)

### 15.6 维护规则

- **页面结构变更时**: 同步更新受影响的 tools/ 脚本、`tools/l10n/` 表, 并在 TECH.md 对应小节记录变更
- **一次性脚本不入仓库**: 历史累计 ~478 个临时脚本不迁移 — 只有可复用、经实战验证的工具才进 tools/
- **路径定位**: 全部脚本用 repo-relative `import.meta.url` 推导 ROOT, 不硬编码绝对路径
- **代码风格**: `tools/*.mjs` 不在 `.prettierignore` 内, 受 prettier/eslint 约束 — 提交前 `npx prettier --write "tools/*.mjs"` + `npx eslint "tools/*.mjs"`
- **提交纪律**: 数据修复 (yaml) 与工具/文档 (tools/ + TECH.md) 分开提交, 便于回溯

---

## 16. 37 语言架构与上架流程

> 2026-09-23 上线: 站点从 15 语言扩展到 **34 语言** (新增 19: cs,th,hr,tl,hu,ro,sk,bg,sl,sr,ja,ko,tr,id,he,ms,lt,lv,et)。
> 2026-10-16 收敛: 先扩充 6 语言 (kk,vi,uz,uk,az,fa) 至 40, 随后**删除 ja/ko/vi → 37 语言** (en + 36, 见 §16.6)。
> 设计: 新语言**立即可见** — 页面走 EN-fallback 管线渲染, 整语言 noindex (零 SEO 风险), 每语言只种子翻译
> 导航 UI 键 (~84 个) + config 元数据 + 完整翻译的 home.yaml; 深度内容翻译为后续工作 (与 §15 泄漏清零同流程)。

### 16.1 语言注册表触点 (改语言列表必须同步的全部文件)

| 文件                                                               | 作用                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/i18n/config.ts`                                               | `languages` map — 驱动全部 `getStaticPaths()` (~100 文件)、middleware、`getLangFromUrl`                                                                                                                                                                                      |
| `src/data/site/languages.yaml`                                     | 切换器注册表 (code/name/locale/textDirection/enabled) — 用户展示顺序, Header 有 `enabled !== false` 过滤; 亦驱动 pageLangs、check 门槛 locales、hreflang enabled 集                                                                                                          |
| `functions/_middleware.ts`                                         | CF Pages 语言重定向: `LANGUAGES` + `REMOVED_LOCALES` (zh,vi,hi,ja,ko) + `ACCEPT_LANG_MAP` (含 fil→tl, iw→he, in→id 别名) + `LOCALE_MAP` (国家码→语言)                                                                                                                        |
| `src/config/seo-suppress.json` + `src/config/sitemap-exclude.json` | 22 码 noindex 正则 `^/(?:az\|bg\|et\|fa\|he\|hr\|hu\|id\|kk\|lt\|lv\|ms\|ro\|sk\|sl\|sr\|th\|tl\|tr\|uk\|uz\|zh)(?:/\|$)` (cs 2026-09-27, sv/da/el/no/ru + nl/fi/pl/ar/pt 2026-09-28 毕业移出; ja/ko/vi 2026-10-16 随语言删除移出) — sitemap 从 seo-suppress 派生 (单一来源) |
| `astro.config.ts`                                                  | `buildLocalizedRedirects` locales — v2/遗留重定向 × 语言前缀                                                                                                                                                                                                                 |
| `scripts/fold-untranslated-canonical.mjs`                          | `LANGS` 列表 (noindex 页自动跳过, 毕业后才实际生效) + `STOPWORDS` 语言检测词条 (cs 2026-09-27、pl 2026-09-28 新增; sv/no/da/nl/fi/pt 原有, el/ru/ar 走 NON_LATIN 正则; ja 2026-09-29 新增 NON_LATIN CJK 正则 — 停用词机制只匹配拉丁 token, 对日文无效)                       |
| `scripts/generate-geo-files.ts` / `scripts/build-geo-v4.ts`        | llms-full.txt 语言段 + 每语言 llms.txt (`tagline[lang] \|\| tagline.en` 安全回退)                                                                                                                                                                                            |

其他固定列表: `Layout.astro` `FULLY_LOCALIZED=['en','de','fr','es','it','cs','sv','da','el','no','ru','nl','fi','pl','ar','pt']` (hreflang 背书门槛, 16 语言; ja 2026-09-29 毕业加入、2026-10-16 随语言删除移出) 与 `RTL_LANGS={'ar','he'}`; `generate-sitemaps.mjs` hreflang alternates `['fr','de','es','it','cs','sv','da','el','no','ru','nl','fi','pl','ar','pt']`; `generate-ai-corpus.mjs` LANGS (16 语言全含, 无 ja); `tools/i18n-verify-home.mjs` / `tools/i18n-wordcount.mjs` 语言清单 (含全部毕业语言)。

### 16.2 新语言种子构成 (每语言 4 件事)

1. **导航 UI 键**: `tools/l10n/ui.<lang>.json` (~84 键 = Header navTextMap 全部 `nav.*`/`cta.*` + `header.language` + `search.*`×3) → `node tools/ui-seed.mjs <lang>` 注入 `src/data/site/i18n-config.json` (100% 覆盖必需键否则中止; 表键必须在 EN 字典内, 防拼写错误)
2. **config**: `src/config.<lang>.yaml` (模板 `config.fr.yaml`) — 翻译 metadata (title/description/keywords 自然本地化)、`openGraph.locale`、`siteSettings` (he 需 `textDirection: rtl`)
3. **home 完整翻译**: `node tools/page-seed.mjs <lang> home` (EN 副本) → `node tools/i18n-audit.mjs home.yaml` → 翻译 `tools/l10n/home.<lang>.json` → `node tools/i18n-apply.mjs home` → 复扫 0 泄漏
4. **门槛文件**: `node tools/page-seed.mjs <lang> about contact news` (有意 EN 副本 — check-translations 只要求存在; 语义上等同 EN-fallback 渲染)

UI 逐键回退: `_gen-uiall.cjs` 生成时合并 `{...en, ...lang}` — 部分 UI 字典缺键时组件不会拿到 undefined (整字典回退仍兜底字典缺席的语言)。

### 16.3 新语言状态表 (graduated = 进入索引/sitemap/hreflang)

| 语言 | nav UI | config | home 译 | 门槛文件                 | graduated                        |
| ---- | ------ | ------ | ------- | ------------------------ | -------------------------------- |
| ja   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | 是 (2026-09-29; 2026-10-16 删除) |
| ko   | ✓      | ✓      | ✓       | EN 副本                  | 否 (2026-10-16 删除)             |
| th   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| tr   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| id   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| cs   | ✓      | ✓      | ✓       | 79 页全译                | **是 (2026-09-27)**              |
| sv   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | **是 (2026-09-28)**              |
| da   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | **是 (2026-09-28)**              |
| el   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | **是 (2026-09-28)**              |
| no   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | **是 (2026-09-28)**              |
| ru   | ✓      | ✓      | ✓       | 79 页全译 + 残留 EN 归零 | **是 (2026-09-28)**              |
| hr   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| hu   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| ro   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| sk   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| bg   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| sl   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| sr   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| lt   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| lv   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| et   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| he   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| ms   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |
| tl   | ✓      | ✓      | ✓       | EN 副本                  | 否                               |

RTL: `ar` + `he` (`Layout.astro` RTL_LANGS); 塞尔维亚语 = Latin 转写 "Srpski"; 他加禄语代码 = `tl` (全站 `[a-z]{2}` 正则兼容, `fil` 经 ACCEPT_LANG_MAP 别名映射)。

### 16.4 语言毕业清单 (graduation checklist)

新语言深度翻译完成、准备进入索引时, 逐项执行:

> 2026-09-27: cs 首个执行本清单 (解除 noindex、进入 sitemap/hreflang、fold STOPWORDS 生效; checkGraphNodes 0 WARN)。
> 2026-09-28: sv/da/el/no/ru 第二批执行 (残留 EN 翻译 161 文件 781 处后毕业; el/ru 无 STOPWORDS 需求 — NON_LATIN 正则覆盖; audit 0 泄漏)。
> 2026-09-28: nl/fi/pl/ar/pt 第三批执行 — 属 §15 原始 15 语言 (不在 16.3 新语言表内), 此前因残留 EN 被 24 码正则整体 noindex; 残留 EN 翻译 145 文件 778 处后毕业 (pl STOPWORDS 新增, nl/fi/pt 原有, ar 走 NON_LATIN; WorldMap 界面/区域名同步本地化 `src/data/world-map-data.ts`)。
> 2026-09-29: ja 第四批执行 (首个 CJK/非拉丁非西里尔/非阿拉伯语言) — 79 页全译, 残留 EN 48 处均为白名单 (数字格式、产品型号、人名、认证代码、公司名); 语言检测走 NON_LATIN CJK 正则; WorldMap 界面/区域名 + `src/data/site/about.ja.yaml` 站点级文案同步本地化。（该语言已于 2026-10-16 删除, 见 §16.6）

1. UI 字典 ~1,721 键补全 (`tools/l10n/` 分批注入), 该语言 `node tools/i18n-audit.mjs` 泄漏 ≈ 0 (含 about/contact/news 真翻译)
2. 从 `seo-suppress.json` + `sitemap-exclude.json` 的 29 码正则中移除该语言代码
3. 加入 `Layout.astro` `FULLY_LOCALIZED` (hreflang 背书) + `scripts/generate-sitemaps.mjs` LANGS
4. 在 `scripts/fold-untranslated-canonical.mjs` 添加该语言 STOPWORDS 词条 (拉丁字母语言; CJK/泰文/希伯来文经 NON_LATIN 正则或天然低命中自动豁免)
5. 加入 `scripts/generate-ai-corpus.mjs` LANGS
6. 扩展 `tools/i18n-verify-home.mjs` / `tools/i18n-wordcount.mjs` 的语言清单
7. 更新本节状态表 (graduated 列 + 日期), 并核查 checkGraphNodes WARN 清零

### 16.5 运行注意

- **构建规模**: ~645 页 / 37 语言 (2026-10-16 删除 ja/ko/vi 后从 ~12,000 页回落, 页面由 page-content 模块化管线按页生成), Cloudflare Pages 20K 文件软限制内
- **REMOVED_LOCALES**: 现为 `zh,vi,hi,ja,ko` — zh/vi/hi 为历史种子语言回收, ja/ko 为 2026-10-16 语言删除后永久 301 剥前缀 (Google 已缓存旧 URL, 权重回收); tr/th/id/cs/he/ro 曾 301→根路径 (2026-09-23 解除, 重新曝光安全 — 页面 noindex 直到毕业)
- **checkGraphNodes WARN**: 每个新语言 ~数十条图节点名缺失警告, 非阻塞噪音, 毕业清单第 7 项清理
- **切换器布局**: 弹窗 `grid-cols-4 sm:grid-cols-5` + `max-h-[65vh] overflow-y-auto`, 容器 `max-w-2xl`; 展示顺序 = `languages.yaml` 文件顺序 (用户指定)
- **`functions/_middleware.ts` 随 Pages 自动部署** — push 即生效, 无需单独发布

### 16.6 语言删除 (2026-10-16, 40 → 37)

> 删除 ja/ko/vi: 翻译 ROI 不及预期 (ja 79 页全译投入未换来自然流量), vi 为 2026-09 扩充语言未毕业。commit `63a1b18` + `a476c8a`。

- **删除范围**: `src/pages/[lang]/{ja,ko,vi}/`、`src/data/pages/{ja,ko,vi}/`、`config.{ja,ko,vi}.yaml`、`tools/l10n/*.{ja,ko,vi}.json`、i18n-config.json/UI 字典相应键、FULLY_LOCALIZED/seo-suppress/sitemap/ai-corpus 等注册表条目
- **重定向兜底 (双层)**: ① astro.config `LEGACY_REDIRECTS` 追加 `'/ja/': '/'`、`'/ko/': '/'` 静态壳页 (meta-refresh + noindex + canonical; validate-dist/fold/ai-corpus 跳过 noindex 页) — 本地 preview 生效; ② 生产环境由 `_middleware.ts` `REMOVED_LOCALES=['zh','vi','hi','ja','ko']` 301 剥前缀接管 (中间件优先于静态资产)
- **死循环修复 (2026-10-18)**: 删除时 `LOCALE_MAP`(JP/KR) 与 `ACCEPT_LANG_MAP` 仍含 ja/ko → 日韩访客根路径被 302 至 /ja/、/ko/ 壳页 → meta-refresh 回根 → 死循环; 已从 `LANGUAGES`/`LOCALE_MAP`/`ACCEPT_LANG_MAP` 移除 ja/ko (checkout.ts 语言集合同步清理)
- **翻译缓存清理**: `.cache/` 7 个 git 跟踪缓存移除 8,033 条 ja/ko/vi 死键 — page-translate-cache 4,743 / content-v2-bing-cache 1,357 / body-components-cache 1,041 / product-translate-cache 610 / i18n-translate-cache 121 / content-l10n-cache 100 / page-meta-cache 61
- **残留死引用清理 (2026-10-18)**: `05_ci_gate.py` LOCALES/STRIP_LOCALE 移除 ja (含汉字/假名特判分支); `translate-products.yml` 默认语言 ja→cs; `fill-missing-page-yamls.mjs`/`inject-rib-l10n.mjs` LANGS 移除 ja; `i18n-tool.cjs` 用法示例更新; 历史一次性脚本 (add-missing-labels-csja.mjs、batch-translate.mjs 注释) 保留原样
- **场景数据 SSoT (2026-10-16, commit `78f1776`)**: pool-ideas 三件套 (`src/data/pool-ideas.ts` + 2 个 MDX) 的尺寸/型号码/壁厚/水深/PSI 全部对齐 `src/data/pool-catalog.ts` (48 型号目录基准); 新增场景数据必须先查目录, 禁止虚构尺寸

---

## 17. 图片处理 (WebP + 尺寸注册表)

### 17.1 WebP 迁移 (P6, 2026-10-21)

`public/images/pools/` 下 15 张 >100KB 产品图已从 PNG/JPG 转为 **WebP (1600px, q82)**: 18.5MB → 0.85MB (**-97%**)。全库 215 处引用 × 97 文件同步替换, 旧图删除后由 R2 自动 prune 清理 (§9.2)。

**效果** (Lighthouse, 产品页): Performance 46 → **67 线上** (84 本地), LCP 15.3s → **3.5s** (1.8s 本地), CLS 0。对比记录见 `docs/technical-audit-2026-10.md` §1.4。

**规则**:

- 新增产品图一律使用 WebP (1600px, q82 起步)
- `<Image format="webp">` (Astro 组件, Sharp 优化) 与静态 `public/images/**/*.webp` 并存; 本地图片走 `astro:assets`, 远程图片走 Unpic CDN
- Hero 图 `loading="eager"` + `fetchpriority="high"`

### 17.2 image-dimensions.json (CLS 修复)

`scripts/generate-image-dimensions.mjs` 在每次构建时解析全站图片宽高, 写入 `src/data/site/image-dimensions.json` (**36 条, SSOT**), 由 `vendor/integration/img-dimensions.ts` 在构建期为已知图片注入 `width`/`height` 属性 (防 CLS)。

**规则**: 新增/替换/重命名 `public/images/` 下图片后, 无需手动维护 — 下次 `npm run build` 自动重建; 但**提交前需确认 registry 覆盖所有新图** (运行构建后 git diff 该文件)。
