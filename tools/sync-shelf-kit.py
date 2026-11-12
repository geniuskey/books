#!/usr/bin/env python3
"""Copy the shared shelf home code (tools/shelf-kit/) into sibling shelf repositories.

The shelf home pages (index.html of medical-books, math-books, ...) use the same
shared/js/shelf.js and shelf.css, and the shelves draw covers with the hub's js/covers.js and
css/cover-animations.css. They are written once here; per-shelf values (title, URL,
cover titles, map) come from each shelf's book.json through window.SHELF in its catalog.js.

Run after editing tools/shelf-kit/, then commit each shelf. --check lists shelves whose copy
differs and exits 1, without writing.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Shelves that use the shared kit. A shelf's own rules go in its shelf-local.css, read after
# shelf.css (semi-books: full-text search; music-books: two-column experiments; art-books: the
# gallery wall and wooden shelf). science-books has its own home page design and is not on the kit.
SHELVES = ['medical-books', 'math-books', 'construction-books', 'money-books', 'computing-books',
           'semi-books', 'music-books', 'system-books', 'art-books']
# 원본(books 저장소 기준 경로) → 서가 안 경로. 표지 그림과 움직임은 허브 사이트가 쓰는 파일이 곧 원본이다.
FILES = {'tools/shelf-kit/shelf.js': 'shared/js/shelf.js', 'tools/shelf-kit/shelf.css': 'shelf.css',
         'js/covers.js': 'shared/js/covers.js', 'css/cover-animations.css': 'shared/css/cover-animations.css'}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--check', action='store_true', help='report stale copies without writing')
    args = parser.parse_args()
    stale = []
    for shelf in SHELVES:
        directory = ROOT.parent / shelf
        if not directory.is_dir():
            print(f'skip: {shelf} is not checked out next to books')
            continue
        for source, target in FILES.items():
            text = (ROOT / source).read_text(encoding='utf-8')
            path = directory / target
            if not path.is_file() or path.read_text(encoding='utf-8') != text:
                stale.append(f'{shelf}/{target}')
                if not args.check:
                    path.write_text(text, encoding='utf-8')
    for line in stale:
        print(('stale: ' if args.check else 'updated: ') + line)
    print(f'{len(stale)} file(s) {"differ" if args.check else "updated"}')
    return 1 if args.check and stale else 0


if __name__ == '__main__':
    sys.exit(main())
