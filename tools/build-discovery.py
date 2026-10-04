"""Build the static discovery index from book anchors and editorial metadata."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    catalog = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))
    learning = json.loads((ROOT / 'data/learning.json').read_text(encoding='utf-8'))
    anchors = json.loads((ROOT / 'data/experiment-catalog.json').read_text(encoding='utf-8'))
    books = {book['id']: book for book in catalog['books'] if book['status'] == 'published'}
    featured = {book['id'] + '/' + item['link']: item
                for book in books.values() for item in book.get('featured', [])}
    experiments = []
    for item in anchors:
        book = books[item['bookId']]
        eid = item['id']
        feature = featured.get(item['bookId'] + '/' + item['link'])
        meta = learning['experiments'].get(item['bookId'] + '/' + item['link'].split('#')[-1]) if feature else None
        experiments.append(dict(
            id=eid, bookId=item['bookId'], title=item['title'],
            description=feature['desc'] if feature else '',
            url=book['url'].rstrip('/') + '/' + item['link'],
            image=feature['image'] if feature else '',
            question=meta['question'] if meta else '',
            concepts=meta['concepts'] if meta else [],
            level=book.get('level', '입문'), reviewStatus='unreviewed',
        ))
    result = dict(schemaVersion=1, experiments=experiments, concepts=learning['concepts'], paths=learning['paths'])
    return result


if __name__ == '__main__':
    result = build()
    (ROOT / 'data/discovery.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Built {len(result["experiments"])} experiments and {len(result["paths"])} paths')
