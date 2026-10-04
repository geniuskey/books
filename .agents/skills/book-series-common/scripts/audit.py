#!/usr/bin/env python3
"""Read-only audit of a book-series static book's shared site elements."""
import re
import sys
import json
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: audit.py /path/to/book")
root = Path(sys.argv[1]).resolve()
if not root.is_dir():
    raise SystemExit(f"not a directory: {root}")
pages = sorted(root.glob("*.html")) + sorted((root / "chapters").glob("*.html"))
issues = []
catalog = root.parent / "books/data/books.json"
if catalog.is_file():
    books = json.loads(catalog.read_text(encoding="utf-8"))["books"]
    entry = next((book for book in books if book["id"] == root.name), None)
    if not entry or entry.get("status") != "published":
        issues.append("books/data/books.json: book is not published")
    elif entry.get("url", "").rstrip("/") != f"https://{root.name}.euiyun.com":
        issues.append("books/data/books.json: book URL differs from CNAME")
peer = root.parent / "testbook/index.html"
expected_token = None
if peer.is_file():
    match = re.search(r'data-cf-beacon=[^>]*?([a-f0-9]{32})', peer.read_text(encoding="utf-8"))
    if match:
        expected_token = match.group(1)
if not pages:
    issues.append("no HTML pages found")
for path in pages:
    html = path.read_text(encoding="utf-8")
    head = html.split("</head>", 1)[0]
    rel = path.relative_to(root)
    checks = {
        "analytics beacon": head.count("static.cloudflareinsights.com/beacon.min.js") == 1,
        "canonical": 'rel="canonical"' in head,
        "description": 'name="description"' in head,
        "Open Graph": 'property="og:image"' in head and 'property="og:url"' in head,
        "Twitter card": 'name="twitter:card"' in head,
        "JSON-LD": 'type="application/ld+json"' in head,
        "favicon": 'rel="icon"' in head,
    }
    for label, passed in checks.items():
        if not passed:
            issues.append(f"{rel}: {label}")
    token = re.search(r'data-cf-beacon=[^>]*?([a-f0-9]{32})', head)
    if expected_token and (not token or token.group(1) != expected_token):
        issues.append(f"{rel}: analytics token differs from testbook")
    markers = re.search(r"<!--head:start .*?<!--head:end-->", head, re.S)
    if markers and "static.cloudflareinsights.com/beacon.min.js" in markers.group():
        issues.append(f"{rel}: analytics is inside generated head block")
for name in ("CNAME", "robots.txt", "sitemap.xml", "og.png"):
    if not (root / name).is_file():
        issues.append(f"missing {name}")
js = root / "js/common.js"
if js.is_file():
    source = js.read_text(encoding="utf-8")
    if "https://books.euiyun.com/" not in source:
        issues.append("js/common.js: books hub link")
    if "https://books.euiyun.com/feedback.html?book=" not in source:
        issues.append("js/common.js: reader feedback link")
else:
    issues.append("missing js/common.js")
print(f"{root.name}: {len(pages)} HTML pages; {len(issues)} issue(s)")
for issue in issues:
    print("-", issue)
raise SystemExit(bool(issues))
