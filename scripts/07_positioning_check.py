#!/usr/bin/env python3
"""
07_positioning_check.py — brand-positioning gate for inflatablepoolfactory.com

Verifies that the public pages consistently present Inflatable Pool Factory as
an inflatable pool / drop-stitch SPA manufacturer (OEM/ODM), and that legacy
water-sports positioning (RIB boats, SUP boards, kayaks, paddle boards) has not
leaked back into the core landing pages.

Usage:
    python3 scripts/07_positioning_check.py --base https://inflatablepoolfactory.com
    python3 scripts/07_positioning_check.py --dist ./dist --strict
    python3 scripts/07_positioning_check.py --base ... --strict --json report.json

Exit codes: 0 = pass (warnings allowed unless --strict), 1 = blocking issue.
"""

import argparse
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

PAGES = [
    "/",
    "/products/",
    "/oem-odm/",
    "/manufacturing/",
    "/quality-control/",
    "/commercial-pools/",
    "/private-label/",
    "/wholesale/",
    "/request-quotation/",
]

# Identity + product vocabulary every core page should carry at least once.
REQUIRED_TERMS = {
    "inflatable pool": r"inflatable\s+pool",
    "drop stitch": r"drop[\s-]?stitch",
    "OEM": r"\bOEM\b",
    "ODM": r"\bODM\b",
    "manufacturer": r"manufactur(?:er|ing|ed)",
}

# Terms that belong to the legacy RIB/SUP catalogue, not this site.
FORBIDDEN_TERMS = {
    "RIB boats": r"\bRIB\b",
    "SUP boards": r"\bSUP\b",
    "kayak": r"\bkayak",
    "paddle board": r"paddle\s*board",
    "yacht tender": r"yacht\s+tender",
}

CONTACT_CHECKS = {
    "email": "info@inflatablepoolfactory.com",
    "phone": "+8613305324192",
}

TAG_STRIP = re.compile(r"<(script|style|svg|noscript|template)\b[^>]*>.*?</\1>", re.S | re.I)
TAG_RE = re.compile(r"<[^>]+>")
LD_JSON_RE = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.S | re.I)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.I)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)
CFEMAIL_RE = re.compile(r'data-cfemail=["\']([0-9a-fA-F]+)["\']')


def decode_cfemail(markup):
    """Decode Cloudflare email-protection spans back to the real address."""
    addresses = []
    for hex_value in CFEMAIL_RE.findall(markup):
        try:
            data = bytes.fromhex(hex_value)
        except ValueError:
            continue
        if not data:
            continue
        key = data[0]
        addresses.append("".join(chr(byte ^ key) for byte in data[1:]))
    return addresses


def fetch(url, timeout):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "InflatablePoolFactory-PositioningCheck/1.0 (+https://inflatablepoolfactory.com)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def load_page(path, base, dist, timeout):
    if base:
        url = base.rstrip("/") + (path if path != "/" else "/")
        return fetch(url, timeout)
    rel = path.strip("/")
    candidates = [
        os.path.join(dist, rel, "index.html") if rel else os.path.join(dist, "index.html"),
        os.path.join(dist, rel) if rel else os.path.join(dist, "index.html"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            with open(candidate, encoding="utf-8", errors="replace") as handle:
                return handle.read()
    raise FileNotFoundError(f"no built HTML found for {path} under {dist}")


def visible_text(markup):
    text = TAG_STRIP.sub(" ", markup)
    text = TAG_RE.sub(" ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def first_match(pattern, markup):
    match = pattern.search(markup)
    if not match:
        return ""
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", match.group(1)))).strip()


def ld_json_names(markup):
    names = []
    for block in LD_JSON_RE.findall(markup):
        try:
            data = json.loads(block)
        except (TypeError, ValueError):
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                name = node.get("name")
                if isinstance(name, str):
                    names.append(name)
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    return names


def check_page(path, markup):
    errors, warnings = [], []
    text = visible_text(markup)
    lower = text.lower()
    title = first_match(TITLE_RE, markup)
    h1 = first_match(H1_RE, markup)
    heading_text = f"{title} {h1}".lower()

    if not text:
        errors.append("page rendered no visible text")
        return errors, warnings, {}

    for label, pattern in REQUIRED_TERMS.items():
        found = re.search(pattern, text, re.I) is not None
        if not found:
            target = errors if path == "/" else warnings
            target.append(f"missing required term: {label}")

    for label, pattern in FORBIDDEN_TERMS.items():
        for match in re.finditer(pattern, text, re.I):
            start = max(0, match.start() - 60)
            end = min(len(text), match.end() + 60)
            snippet = text[start:end].strip()
            errors.append(f"forbidden positioning term '{label}': …{snippet}…")
            break

    # Brand identity must be explicit in the title/H1, not only in the footer.
    if not re.search(r"inflatable\s+(?:swimming\s+)?pools?", heading_text) and "inflatable pool factory" not in heading_text:
        warnings.append("title/H1 does not mention inflatable pools")

    if path == "/":
        normalized = re.sub(r"[\s()-]", "", text)
        protected_emails = set(decode_cfemail(markup))
        for label, value in CONTACT_CHECKS.items():
            exposed = value in normalized or value.replace("+", "") in normalized
            if not exposed and label == "email":
                exposed = any(address == value for address in protected_emails)
            if not exposed:
                warnings.append(f"homepage does not expose the canonical {label}")

        for name in ld_json_names(markup):
            if re.search(r"\b(RIB|SUP|kayak|paddle board)\b", name, re.I):
                errors.append(f"JSON-LD entity name still uses legacy positioning: {name}")

    stats = {"title": title, "h1": h1, "words": len(text.split())}
    return errors, warnings, stats


def main():
    parser = argparse.ArgumentParser(description="Inflatable pool brand-positioning gate")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--base", help="Live site origin, e.g. https://inflatablepoolfactory.com")
    source.add_argument("--dist", help="Local dist/ directory produced by npm run build")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures")
    parser.add_argument("--timeout", type=float, default=20.0, help="Per-request timeout in seconds")
    parser.add_argument("--json", dest="json_out", help="Write the full report as JSON")
    args = parser.parse_args()

    report = {"source": args.base or args.dist, "strict": args.strict, "pages": {}, "errors": [], "warnings": []}

    for path in PAGES:
        try:
            markup = load_page(path, args.base, args.dist, args.timeout)
        except (FileNotFoundError, urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
            message = f"{path}: could not load page ({exc})"
            report["errors"].append(message)
            print(f"ERROR  {message}")
            continue
        errors, warnings, stats = check_page(path, markup)
        report["pages"][path] = {"errors": errors, "warnings": warnings, **stats}
        for error in errors:
            report["errors"].append(f"{path}: {error}")
            print(f"ERROR  {path}  {error}")
        for warning in warnings:
            report["warnings"].append(f"{path}: {warning}")
            print(f"WARN   {path}  {warning}")
        if not errors and not warnings:
            print(f"OK     {path}  ({stats['words']} words)")

    print()
    print(f"Pages checked : {len(report['pages'])}/{len(PAGES)}")
    print(f"Errors        : {len(report['errors'])}")
    print(f"Warnings      : {len(report['warnings'])}")

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as handle:
            json.dump(report, handle, ensure_ascii=False, indent=2)

    blocking = report["errors"] or (args.strict and report["warnings"])
    if blocking:
        print("\nPositioning gate FAILED.")
        return 1
    print("\nPositioning gate passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
