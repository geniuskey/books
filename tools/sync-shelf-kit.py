#!/usr/bin/env python3
"""Copy the shared shelf home code (tools/shelf-kit/) into sibling shelf repositories.

The shelf home pages (index.html of medical-books, math-books, ...) use the same
shared/js/shelf.js and shelf.css. They are written once here; per-shelf values (title, URL,
cover titles, map) come from each shelf's book.json through window.SHELF in its catalog.js.

Run after editing tools/shelf-kit/, then commit each shelf. --check lists shelves whose copy
differs and exits 1, without writing.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'tools/shelf-kit'
# Shelves that use the shared kit. semi-books, music-books, system-books and art-books still
# keep their own shelf code (search, extra sections or a different layout).
SHELVES = ['medical-books', 'math-books', 'construction-books', 'money-books', 'computing-books']
FILES = {'shelf.js': 'shared/js/shelf.js', 'shelf.css': 'shelf.css'}


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
            text = (KIT / source).read_text(encoding='utf-8')
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
