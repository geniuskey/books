"""Snapshot experiment anchors from sibling book repositories.

Run when book content changes. The resulting catalog is committed so the
discovery site can be rebuilt without checking out every book.
"""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TAG = re.compile(r'<(?:div|section|article)\b[^>]*>', re.I)
ATTRIBUTE = re.compile(r'([\w-]+)\s*=\s*(["\'])(.*?)\2', re.S)
HEADING = re.compile(r'<h[234]\b[^>]*>(.*?)</h[234]>', re.I | re.S)
STRIP = re.compile(r'<[^>]+>')


def clean(markup):
    return ' '.join(html.unescape(STRIP.sub(' ', markup)).split())


def collect(book_ids=None):
    books = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))['books']
    cached = {}
    if book_ids is not None:
        published = {book['id'] for book in books if book['status'] == 'published'}
        if set(book_ids) - published:
            raise ValueError('Selected books must be published catalog IDs')
        for entry in json.loads((ROOT / 'data/experiment-catalog.json').read_text(encoding='utf-8')):
            cached.setdefault(entry['bookId'], []).append(entry)
    entries = []
    for book in books:
        if book['status'] != 'published':
            continue
        if book_ids is not None and book['id'] not in book_ids:
            entries.extend(cached.get(book['id'], []))
            continue
        # 서가 저장소의 한 권은 checkout에 하위 경로를 적는다(예: artbook/color). 없으면 책 ID 폴더.
        chapters = ROOT.parent / book.get('checkout', book['id']) / 'chapters'
        if not chapters.is_dir():
            raise FileNotFoundError(f'Book checkout is required: {chapters}')
        for path in sorted(chapters.glob('*.html')):
            source = path.read_text(encoding='utf-8')
            for match in TAG.finditer(source):
                attrs = dict((key.lower(), value) for key, _, value in ATTRIBUTE.findall(match.group()))
                anchor = attrs.get('id', '')
                if not anchor or 'sim' not in attrs.get('class', '').split():
                    continue
                nearby = source[match.end():match.end() + 800]
                heading = None if re.match(r'\s*</(?:div|section|article)>', nearby, re.I) else HEADING.search(nearby)
                if not heading:
                    earlier = list(re.finditer(r'<h[23]\b[^>]*>(.*?)</h[23]>', source[:match.start()], re.I | re.S))
                    if not earlier:
                        raise ValueError(f'Missing experiment title: {path}#{anchor}')
                    heading = earlier[-1]
                entries.append(dict(id=f"{book['id']}/{path.stem}/{anchor}", bookId=book['id'],
                                    title=clean(heading.group(1)),
                                    link=f'chapters/{path.name}#{anchor}'))
    ids = [entry['id'] for entry in entries]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate experiment ID in book chapters')
    return entries


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--book', action='append', help='Refresh only this published book ID; repeat for multiple books')
    entries = collect(parser.parse_args().book)
    output = ROOT / 'data/experiment-catalog.json'
    output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Collected {len(entries)} linked experiments into {output}')
