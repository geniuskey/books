"""Validate catalog references, generated index, local assets and available book anchors."""
import json
import re
import subprocess
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


catalog, learning, discovery, anchors = read('books.json'), read('learning.json'), read('discovery.json'), read('experiment-catalog.json')
validation = read('model-validation.json')['experiments']
book_ids = unique(catalog['books'], 'book')
fields = unique(catalog['fields'], 'field')
concept_ids = unique(learning['concepts'], 'concept')
unique(learning['paths'], 'path')
unique(learning['bookPaths'], 'book path')
unique(discovery['experiments'], 'experiment')
unique(anchors, 'catalog experiment')
books = {b['id']: b for b in catalog['books']}
backlog = read('editorial-backlog.json')
archived_books = [item['book'] for item in backlog['items']]
archived_ids = unique(archived_books, 'editorial backlog book')
check(not book_ids & archived_ids, 'Editorial backlog books must not appear in the public catalog')
phase_ids = {p['id'] for p in catalog['phases']}
check(sum(b.get('phase') == 1 for b in catalog['books'] if b['status'] != 'published') <= 3,
      'Next phase must contain at most three books, including books being written')
for b in catalog['books']:
    check(b['status'] in catalog['statusLabels'], f'Unknown status: {b["id"]}')
    if b['status'] != 'published':
        check(b.get('phase') in phase_ids, f'Unknown roadmap phase: {b["id"]}')
for item in backlog['items']:
    check(item['disposition'] in {'merge', 'idea', 'removed-field'}, 'Unknown backlog disposition')
    check(bool(item.get('reason', '').strip()), f'Missing backlog reason: {item["book"]["id"]}')
    if item['disposition'] == 'merge':
        check(bool(item.get('targets')), f'Missing merge targets: {item["book"]["id"]}')
    check(set(item.get('targets', [])) <= book_ids | archived_ids,
          f'Unknown merge target: {item["book"]["id"]}')
for decision in backlog.get('scopeDecisions', []):
    check(decision['replacement'] in book_ids and decision['sectionTarget'] in book_ids,
          f'Unknown scope decision target: {decision["source"]}')
expected = set()
featured_links = set()
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
        featured_links.add(b['id'] + '/' + f['link'])
        check((ROOT / f['image']).is_file(), f'Missing image: {f["image"]}')
        anchor(b['id'], f['link'])

check(expected <= set(learning['experiments']), 'Featured experiments are missing editorial metadata')
catalog_links = {item['bookId'] + '/' + item['link'] for item in anchors}
catalog_ids = {item['id'] for item in anchors}
editorial_keys = {item['bookId'] + '/' + item['link'].split('#')[-1] for item in anchors}
check(set(learning['experiments']) <= editorial_keys, 'Editorial metadata references a missing experiment')
check(set(validation) <= catalog_ids, 'Model validation references a missing experiment')
check(featured_links <= catalog_links, 'Featured experiment is absent from full catalog')
check({item['id'] for item in anchors} == {e['id'] for e in discovery['experiments']}, 'Discovery index has missing/extra experiments')
for item in anchors:
    check(item['bookId'] in books and books[item['bookId']]['status'] == 'published', f'Invalid catalog book: {item["id"]}')
    check(bool(item['title'].strip()), f'Untitled catalog experiment: {item["id"]}')
    if item['bookId'] in books:
        anchor(item['bookId'], item['link'])
for eid, e in learning['experiments'].items():
    check(bool(e['question'].strip()), f'Missing learning question: {eid}')
    check(bool(e['concepts']) and set(e['concepts']) <= concept_ids, f'Invalid concept reference: {eid}')
    if 'description' in e:
        check(bool(e['description'].strip()), f'Empty experiment description: {eid}')
for eid, record in validation.items():
    check(record.get('bookId') == eid.split('/')[0], f'Validation book mismatch: {eid}')
    for key in ('sourceFile', 'sourceSha256', 'checkedOn', 'reviewer', 'summary', 'method', 'reference'):
        check(bool(record.get(key)), f'Missing validation {key}: {eid}')
    check(bool(record.get('cases')), f'No reference cases: {eid}')
for p in learning['paths']:
    check(bool(p['steps']) and bool(p['challenge']), f'Incomplete path: {p["id"]}')
    for key in ('audience', 'duration', 'outcome', 'scenario', 'prerequisites', 'note'):
        check(bool(p.get(key, '').strip()), f'Missing path {key}: {p["id"]}')
    check(bool(p.get('checks')) and all(isinstance(c, str) and c.strip() for c in p.get('checks', [])),
          f'Missing path answer checks: {p["id"]}')
    for step in p['steps']:
        for key in ('title', 'duration', 'why', 'task', 'record'):
            check(bool(step.get(key, '').strip()), f'Missing step {key}: {p["id"]}')
        check(step['bookId'] in book_ids, f'Unknown book: {step["bookId"]}')
        if step['bookId'] in books:
            check(books[step['bookId']]['status'] == 'published', f'Unpublished path step: {step["bookId"]}')
            anchor(step['bookId'], step['link'])

# Rebuild in memory, so checking never edits tracked files.
covered_books = set()
for p in learning['bookPaths']:
    for key in ('group', 'title', 'start', 'outcome'):
        check(bool(p.get(key, '').strip()), f'Missing book path {key}: {p["id"]}')
    check(bool(p.get('steps')), f'Empty book path: {p["id"]}')
    for step in p.get('steps', []):
        bid = step.get('bookId')
        check(bid in books and books[bid]['status'] == 'published', f'Invalid book path book: {bid}')
        covered_books.add(bid)
        for key in ('focus', 'why'):
            check(bool(step.get(key, '').strip()), f'Missing book path step {key}: {p["id"]}')
check(covered_books == {b['id'] for b in books.values() if b['status'] == 'published'},
      'Book paths must cover every published book')
all_path_ids = [p['id'] for p in learning['paths'] + learning['bookPaths']]
check(len(all_path_ids) == len(set(all_path_ids)), 'Book and experiment path IDs overlap')

import importlib.util
spec = importlib.util.spec_from_file_location('builder', ROOT / 'tools/build-discovery.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
check(builder.build() == discovery, 'Generated discovery.json is stale; run tools/build-discovery.py')
model_check = subprocess.run(['node', str(ROOT / 'tools/check-models.cjs')], capture_output=True, text=True)
check(model_check.returncode == 0, 'Model reference checks failed: ' + (model_check.stderr or model_check.stdout).strip())
if all((ROOT.parent / b['id'] / 'chapters').is_dir() for b in catalog['books'] if b['status'] == 'published'):
    spec = importlib.util.spec_from_file_location('collector', ROOT / 'tools/collect-experiments.py')
    collector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(collector)
    check(collector.collect() == anchors, 'Experiment catalog is stale; run tools/collect-experiments.py')

if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'OK: {len(anchors)} experiments ({len(learning["experiments"])} enriched, {len(validation)} reference-checked), '
      f'{len(learning["paths"])} experiment paths, {len(learning["bookPaths"])} book paths covering {len(covered_books)} books, '
      f'{checked_anchors} local anchors; {skipped_anchors} anchors need external checking')
print(model_check.stdout.strip())
