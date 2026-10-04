"""Build the static discovery index from book anchors and editorial metadata.

Writes two files so each page downloads only what it renders:
- data/discovery.json: the experiment search index (simulators.html)
- data/paths.json: the reading and experiment paths (paths.html)

Experiments omit what the page can rebuild from books.json: bookId (the ID prefix),
url (book URL + chapters/<chapter>.html#<anchor>, unless `link` says otherwise),
level (the book's level), and empty or default fields.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ('discovery.json', 'paths.json')


def build():
    catalog = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))
    learning = json.loads((ROOT / 'data/learning.json').read_text(encoding='utf-8'))
    anchors = json.loads((ROOT / 'data/experiment-catalog.json').read_text(encoding='utf-8'))
    validation = json.loads((ROOT / 'data/model-validation.json').read_text(encoding='utf-8'))['experiments']
    books = {book['id']: book for book in catalog['books'] if book['status'] == 'published'}
    featured = {book['id'] + '/' + item['link']: item
                for book in books.values() for item in book.get('featured', [])}
    experiments = []
    for item in anchors:
        eid = item['id']
        if eid.split('/')[0] != item['bookId']:
            raise ValueError(f'Experiment ID must start with its book ID: {eid}')
        feature = featured.get(item['bookId'] + '/' + item['link'])
        meta = learning['experiments'].get(item['bookId'] + '/' + item['link'].split('#')[-1])
        experiment = dict(id=eid, title=item['title'])
        _, chapter, anchor = (eid.split('/', 2) + ['', ''])[:3]
        if item['link'] != f'chapters/{chapter}.html#{anchor}':
            experiment['link'] = item['link']
        description = (meta.get('description', '') if meta else '') or (feature['desc'] if feature else '')
        if description:
            experiment['description'] = description
        if meta and meta['question']:
            experiment['question'] = meta['question']
        if meta and meta['concepts']:
            experiment['concepts'] = meta['concepts']
        if eid in validation:
            experiment['reviewStatus'] = 'reference-checked'
            experiment['validationSummary'] = validation[eid]['summary']
        experiments.append(experiment)
    discovery = dict(schemaVersion=2, experiments=experiments, concepts=learning['concepts'])
    paths = dict(schemaVersion=2, paths=learning['paths'], bookPaths=learning['bookPaths'])
    return {'discovery.json': discovery, 'paths.json': paths}


def dump(data):
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'


if __name__ == '__main__':
    result = build()
    for name, data in result.items():
        (ROOT / 'data' / name).write_text(dump(data), encoding='utf-8')
    print(f'Built {len(result["discovery.json"]["experiments"])} experiments, '
          f'{len(result["paths.json"]["paths"])} experiment paths, '
          f'{len(result["paths.json"]["bookPaths"])} book paths')
