---
name: book-series-common
description: Audit and maintain shared site elements across the euiyun book-series static book repositories when adding or updating a book.
---

# Book series common elements

Use this when a book is added or its shared site integration changes in sibling book-series checkouts. Each book directory is a separate Git repository. Compare the target book with a recently maintained peer before editing; preserve its own design and content.

## Shared site contract

- Every published HTML page, including top-level gallery pages and `chapters/*.html`, has exactly one Cloudflare Web Analytics beacon in `<head>`. Read the token from a maintained peer such as `testbook`; use the same token. Keep the beacon outside `<!--head:start ...-->` / `<!--head:end-->` blocks so `tools/head.py` does not erase it.
- Each page has its own title, description, canonical URL, OG tags, `twitter:card`, favicon, and JSON-LD. The book root has `CNAME`, `robots.txt`, `sitemap.xml`, and `og.png`. Prefer the book's existing head/SEO generator for generated metadata; check for unrelated date or content churn before accepting its output.
- The shared header links to `https://books.euiyun.com/`. The header and footer link to `https://books.euiyun.com/feedback.html?book=<book-id>&page=<encoded current URL>`. Confirm the book ID is published in `books/data/books.json`; otherwise the feedback page will not attach book/page context, so update the catalog or avoid promising that context.
- When changing a book's catalog status to `published`, run `books/tools/collect-experiments.py` and `books/tools/build-discovery.py`, then `books/tools/check-discovery.py`. The generated experiment catalog and discovery index must match the set of published books.
- Preserve existing navigation, theme toggle, chapter progress, license attribution, and book-specific controls. Keep small-screen header usable.

Run `python3 scripts/audit.py /path/to/book` for a focused report. Fix missing items in the target repository, then run its existing `tools/check.py` or `tools/check.js` and repeat the audit. Check `git diff` for generated-file churn. This script is read-only and does not replace visual QA when header controls change.
