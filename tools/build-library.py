#!/usr/bin/env python3
"""Write a static book list into library/index.html from data/books.json.

The library page renders its shelves with JavaScript, so crawlers that do not run scripts
(Naver, Bing, AI crawlers) would otherwise see no book titles or links. This keeps a plain
list between the static-catalog markers; js/library.js removes it when it renders, and the
"js" class on <html> hides it before then. Run with --check to exit 1 when it is out of date.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'library' / 'index.html'
BLOCK = re.compile(r'(<!-- static-catalog:start -->).*?(<!-- static-catalog:end -->)', re.S)


def esc(value):
    return html.escape(str(value), quote=True)


def render(data):
    labels = data.get('statusLabels', {})
    parts = ['\n<div class="static-catalog">']
    for field in data['fields']:
        books = [b for b in data['books'] if b['field'] == field['id']]
        if not books:
            continue
        parts.append(f'<section class="group"><h2>{esc(field["name"])}</h2><ul>')
        for book in books:
            status = book.get('status')
            link = book.get('url') if status in ('published', 'writing') else ''
            title = f'<a href="{esc(link)}">{esc(book["title"])}</a>' if link else esc(book['title'])
            note = '' if status == 'published' else f' ({esc(labels.get(status, status))})'
            about = book.get('description') or book.get('subtitle') or ''
            parts.append(f'<li>{title} · {esc(book.get("subtitle", ""))}{note}<p>{esc(about)}</p></li>')
        parts.append('</ul></section>')
    parts.append('</div>\n')
    return '\n'.join(parts)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = json.loads((ROOT / 'data' / 'books.json').read_text())
    source = PAGE.read_text()
    if not BLOCK.search(source):
        sys.exit('library/index.html has no static-catalog markers')
    updated = BLOCK.sub(lambda m: m.group(1) + render(data) + m.group(2), source)
    if updated == source:
        return
    if args.check:
        sys.exit('library/index.html static catalog is out of date: run python3 tools/build-library.py')
    PAGE.write_text(updated)
    print('Updated library/index.html')


if __name__ == '__main__':
    main()
