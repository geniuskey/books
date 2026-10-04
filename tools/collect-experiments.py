"""Snapshot experiment anchors from sibling book repositories.

Run when book content changes. The resulting catalog is committed so the
discovery site can be rebuilt without checking out every book.
"""
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


def collect():
    books = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))['books']
    entries = []
    for book in books:
        if book['status'] != 'published':
            continue
        chapters = ROOT.parent / book['id'] / 'chapters'
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
    entries = collect()
    output = ROOT / 'data/experiment-catalog.json'
    output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Collected {len(entries)} linked experiments into {output}')
