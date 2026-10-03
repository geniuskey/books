"""Build the small static discovery index from the catalog and editorial metadata."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    catalog = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))
    learning = json.loads((ROOT / 'data/learning.json').read_text(encoding='utf-8'))
    experiments = []
    for book in catalog['books']:
        if book['status'] != 'published':
            continue
        for featured in book.get('featured', []):
            experiment_id = book['id'] + '/' + featured['link'].split('#')[-1]
            meta = learning['experiments'][experiment_id]
            experiments.append(dict(
                id=experiment_id, bookId=book['id'], title=featured['title'],
                description=featured['desc'], url=book['url'].rstrip('/') + '/' + featured['link'],
                image=featured['image'], question=meta['question'], concepts=meta['concepts'],
                level=book.get('level', '입문'), reviewStatus='unreviewed',
            ))
    result = dict(schemaVersion=1, experiments=experiments, concepts=learning['concepts'], paths=learning['paths'])
    return result


if __name__ == '__main__':
    result = build()
    (ROOT / 'data/discovery.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Built {len(result["experiments"])} experiments and {len(result["paths"])} paths')
