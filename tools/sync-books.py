#!/usr/bin/env python3
"""Pull book facts and shelf maps from sibling shelf repositories into data/books.json.

Each shelf repository (../<shelf>) owns its books' facts. This script copies them into the
hub catalog so they are written once:

- Book facts (title, description, status, counts, colors, ...) come from the shelf's
  catalog.json (format euiyun-shelf/1) or, for older shelves, from catalog.js.
- A shelf with a map (catalog.json "map") also owns its field's topic groups (fields[].stages),
  the map title/description/links (fields[].map) and each book's stage. A group may list several
  shelf stages in "stages"; the hub stores the group's ID as the book's stage.
- Hub-only values stay here: field, featured, en, legacyUrls, level, checkout, and anything a
  book lists in "keepLocal" (for example a code renamed to avoid a clash on this site).

Books are matched by "checkout" (<shelf>/<slug>). Run with --check to list differences
without writing; it exits 1 when the catalog is out of date. --remote reads each shelf's
published catalog (https://<shelf domain>/catalog.json or catalog.js) instead of a sibling
checkout, and --hold-publish leaves a change into or out of "published" for a person, since
publishing also needs experiments, reading paths and the OG image (.github/workflows/sync-books.yml).
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SHELVES = ROOT.parent
BOOK_FIELDS = ('title', 'subtitle', 'headline', 'description', 'status', 'color', 'colorDark',
               'topics', 'motif', 'code', 'chapters', 'simulators')
ASSIGNMENT = re.compile(r'window\.\w+_BOOKS\s*=\s*')


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'euiyun-books-sync'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read().decode('utf-8')
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def parse_shelf(read):
    """Return (books, map, field) using read(name) -> text or None, or None without a readable catalog."""
    text = read('catalog.json')
    if text:
        data = json.loads(text)
        if data.get('format') == 'euiyun-shelf/1':
            return data['books'], data.get('map'), data['shelf'].get('field')
    text = read('catalog.js')
    match = text and ASSIGNMENT.search(text)
    if match:
        books, _ = json.JSONDecoder().raw_decode(text, match.end())
        return books, None, None
    return None


def local_shelf(shelf, hub_books):
    directory = SHELVES / shelf
    if not (directory / 'CNAME').is_file():
        return None, None
    read = lambda name: (directory / name).read_text(encoding='utf-8') if (directory / name).is_file() else None
    return parse_shelf(read), 'https://' + (directory / 'CNAME').read_text().strip() + '/'


def remote_shelf(shelf, hub_books):
    # The shelf's domain is the host of any of its books already on the hub.
    hosts = {urlsplit(book['url']).netloc for book in hub_books.values() if book.get('url')}
    if len(hosts) != 1:
        return None, None
    base = f'https://{hosts.pop()}/'
    return parse_shelf(lambda name: fetch(base + name)), base


def sync(catalog, load=local_shelf, hold_publish=False):
    changes, notes = [], []
    by_checkout = {}
    for book in catalog['books']:
        if '/' in book.get('checkout', ''):
            by_checkout.setdefault(book['checkout'].split('/')[0], {})[book['checkout'].split('/', 1)[1]] = book

    def change(where, key, old, new):
        changes.append(f'{where}.{key}: {json.dumps(old, ensure_ascii=False)[:70]} → {json.dumps(new, ensure_ascii=False)[:70]}')

    for shelf, hub_books in sorted(by_checkout.items()):
        loaded, base = load(shelf, hub_books)
        if not loaded:
            notes.append(f'{shelf}: no shelf catalog to read; left unchanged')
            continue
        books, shelf_map, field_id = loaded
        # A map group may hold several shelf stages ("stages"); on the hub a book's stage is its group.
        group_of = {stage: group['id'] for group in (shelf_map or {}).get('groups', []) for stage in group.get('stages', [group['id']])}
        seen = set()
        for source in books:
            # Planned books may not have a checkout yet, so fall back to the ID.
            book = hub_books.get(source.get('slug')) or next((b for b in catalog['books'] if b['id'] == source['id']), None)
            if not book:
                notes.append(f'{shelf}: {source["id"]} is on the shelf but not in books.json (add it with its field)')
                continue
            seen.add(book['id'])
            keep = set(book.get('keepLocal', []))
            updates = {key: source[key] for key in BOOK_FIELDS if key in source and key not in keep}
            if source.get('status') == 'planned':
                # Counts of a book that is not written yet mean nothing on the hub.
                updates.pop('chapters', None), updates.pop('simulators', None)
            # Unpublished books have no public address yet; never guess one.
            if source.get('status') != 'planned' and source.get('url') not in (None, '', '#') and 'url' not in keep:
                updates['url'] = source['url'] if source['url'].startswith('http') else base + source['url']
            if shelf_map and 'stage' not in keep:
                updates['stage'] = group_of[source['stage']]
            if hold_publish and 'status' in updates and 'published' in (book.get('status'), updates['status']) \
                    and book.get('status') != updates['status']:
                notes.append(f'{shelf}: {book["id"]} is {updates.pop("status")} on the shelf; publish it on the hub by hand')
                if book.get('status') != 'published':
                    # Keep the hub's unpublished book whole until a person publishes it.
                    for key in ('url', 'chapters', 'simulators'):
                        updates.pop(key, None)
            for key, value in updates.items():
                if book.get(key) != value:
                    change(book['id'], key, book.get(key), value)
                    book[key] = value
        for book in hub_books.values():
            if book['id'] not in seen:
                notes.append(f'{shelf}: {book["id"]} is in books.json but not on the shelf')

        if shelf_map:
            field = next(f for f in catalog['fields'] if f['id'] == field_id)
            stages = [{key: group[key] for key in ('id', 'name', 'en', 'desc')} for group in shelf_map['groups']]
            field_map = {key: shelf_map[key] for key in ('title', 'desc', 'links') if key in shelf_map}
            for key, value in (('stages', stages), ('map', field_map)):
                if field.get(key) != value:
                    change(f'fields.{field_id}', key, field.get(key), value)
                    field[key] = value
            strays = [b['id'] for b in catalog['books'] if b['field'] == field_id and b['id'] not in seen]
            if strays:
                notes.append(f'{field_id}: books outside {shelf} have no stage on its map: {strays}')
    return changes, notes


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--check', action='store_true', help='report differences without writing')
    parser.add_argument('--remote', action='store_true', help='read published shelf catalogs instead of sibling checkouts')
    parser.add_argument('--hold-publish', action='store_true', help='do not move books into or out of "published"')
    args = parser.parse_args()
    path = ROOT / 'data/books.json'
    catalog = json.loads(path.read_text(encoding='utf-8'))
    changes, notes = sync(catalog, remote_shelf if args.remote else local_shelf, args.hold_publish)
    for line in notes:
        print('note:', line)
    for line in changes:
        print(('stale: ' if args.check else 'updated: ') + line)
    if args.check:
        print(f'{len(changes)} difference(s) from the shelves')
        return 1 if changes else 0
    if changes:
        path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'books.json: {len(changes)} change(s)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
