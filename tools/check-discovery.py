"""Validate catalog references, generated index, local assets and available book anchors."""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
errors = []


def check(condition, message):
    if not condition:
        errors.append(message)


def read(name):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8'))


def unique(items, label):
    ids = [item['id'] for item in items]
    check(len(ids) == len(set(ids)), f'Duplicate {label} IDs')
    return set(ids)


catalog, learning, discovery = read('books.json'), read('learning.json'), read('discovery.json')
book_ids = unique(catalog['books'], 'book')
fields = unique(catalog['fields'], 'field')
concept_ids = unique(learning['concepts'], 'concept')
unique(learning['paths'], 'path')
unique(discovery['experiments'], 'experiment')
books = {b['id']: b for b in catalog['books']}
expected = set()
checked_anchors = 0
skipped_anchors = 0


def anchor(book_id, link):
    global checked_anchors, skipped_anchors
    parts = urlsplit(link)
    check(not parts.scheme and not parts.netloc and parts.path.startswith('chapters/')
          and '..' not in parts.path.split('/'), f'Invalid chapter path: {link}')
    book_root = ROOT.parent / book_id
    if not book_root.is_dir():
        skipped_anchors += 1
        return
    path = book_root / parts.path
    check(path.is_file(), f'Missing chapter: {path}')
    if path.is_file() and parts.fragment:
        content = path.read_text(encoding='utf-8')
        check(bool(re.search(r'''id=["']''' + re.escape(parts.fragment) + r'''["']''', content)),
              f'Missing anchor: {book_id}/{link}')
        checked_anchors += 1


for b in catalog['books']:
    check(b['field'] in fields, f'Unknown field: {b["id"]}')
    if b['status'] != 'published':
        continue
    check(urlsplit(b['url']).scheme == 'https', f'Invalid book URL: {b["id"]}')
    for f in b.get('featured', []):
        eid = b['id'] + '/' + f['link'].split('#')[-1]
        check(eid not in expected, f'Duplicate featured ID: {eid}')
        expected.add(eid)
        check((ROOT / f['image']).is_file(), f'Missing image: {f["image"]}')
        anchor(b['id'], f['link'])

check(expected == set(learning['experiments']), 'Editorial metadata does not match featured experiments')
check(expected == {e['id'] for e in discovery['experiments']}, 'Discovery index has missing/extra experiments')
for eid, e in learning['experiments'].items():
    check(bool(e['question'].strip()), f'Missing learning question: {eid}')
    check(bool(e['concepts']) and set(e['concepts']) <= concept_ids, f'Invalid concept reference: {eid}')
for p in learning['paths']:
    check(bool(p['steps']) and bool(p['challenge']), f'Incomplete path: {p["id"]}')
    for step in p['steps']:
        check(step['bookId'] in book_ids, f'Unknown book: {step["bookId"]}')
        if step['bookId'] in books:
            check(books[step['bookId']]['status'] == 'published', f'Unpublished path step: {step["bookId"]}')
            anchor(step['bookId'], step['link'])

# Rebuild in memory, so checking never edits tracked files.
import importlib.util
spec = importlib.util.spec_from_file_location('builder', ROOT / 'tools/build-discovery.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
check(builder.build() == discovery, 'Generated discovery.json is stale; run tools/build-discovery.py')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'OK: {len(expected)} experiments, {len(learning["paths"])} paths, {checked_anchors} local anchors; {skipped_anchors} anchors need external checking')
