#!/usr/bin/env python3
"""Check public page routes and their local assets without a browser."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
NAMES = ('feedback', 'field', 'library', 'paths', 'roadmap', 'simulators')

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        self.links.extend(v for k, v in attrs if k in ('href', 'src') and v)

fields = json.loads((ROOT / 'data/books.json').read_text())['fields']
page_names = ('', *NAMES, *(f"field/{f['id']}" for f in fields))
for name in page_names:
    path = ROOT / name / 'index.html'
    source = path.read_text()
    route = f'/{name}/' if name else '/'
    assert f'href="https://books.euiyun.com{route}"' in source, path
    parser = Links()
    parser.feed(source)
    for link in parser.links:
        url = urlsplit(urljoin('https://books.euiyun.com' + route, link))
        if url.netloc != 'books.euiyun.com':
            continue
        target = ROOT / url.path.lstrip('/')
        if url.path.endswith('/'):
            target /= 'index.html'
        assert target.is_file(), f'{path}: missing {link}'
    assert source.count('static.cloudflareinsights.com/beacon.min.js') == 1, path

for name in NAMES:
    old = (ROOT / f'{name}.html').read_text()
    script = re.search(r'<script>(.*?)</script>', old, re.S)[1]
    # Run the actual legacy redirect with encoded book/page context and a fragment.
    case = '?book=memorybook&page=https%3A%2F%2Fmemorybook.euiyun.com%2Fchapters%2Fhbm.html%23sim-h3'
    test = f'''const vm = require('node:vm');
const assert = require('node:assert/strict');
vm.runInNewContext({json.dumps(script)}, {{location: {{search: {json.dumps(case)}, hash: '#request', replace(value) {{assert.equal(value, {json.dumps('/' + name + '/' + case + '#request')});}}}}}});'''
    subprocess.run(['node', '-e', test], check=True)

for path in (ROOT / 'js').glob('*.js'):
    source = path.read_text()
    assert not re.search(r'(?:href=["\']|href: ["\'])[^"\']*(?:' + '|'.join(NAMES) + r')\.html', source), path
    subprocess.run(['node', '--check', str(path)], check=True)
source = (ROOT / 'field/index.html').read_text()
redirect = re.search(r'<script>(.*?)</script>', source, re.S)[1]
for field in fields:
    route = '/field/' + field['id'] + '/'
    page = (ROOT / route.lstrip('/') / 'index.html').read_text()
    assert f'data-field="{field["id"]}"' in page
    assert f'content="https://books.euiyun.com{route}"' in page
    metadata = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', page)[1])
    assert metadata['url'] == 'https://books.euiyun.com' + route
    query = '?f=' + field['id'] + '&q=a%26b'
    expected = route + '?q=a%26b#shelf'
    test = f'''const vm = require('node:vm');
const assert = require('node:assert/strict');
vm.runInNewContext({json.dumps(redirect)}, {{URLSearchParams, location: {{search: {json.dumps(query)}, hash: '#shelf', replace(value) {{assert.equal(value, {json.dumps(expected)});}}}}}});'''
    subprocess.run(['node', '-e', test], check=True)
# Invalid query IDs must leave the field chooser usable.
test = f'''require('node:vm').runInNewContext({json.dumps(redirect)}, {{URLSearchParams, location: {{search: '?f=unknown', hash: '', replace() {{throw new Error('Invalid redirect');}}}}}});'''
subprocess.run(['node', '-e', test], check=True)
print(f'OK: {len(page_names)} public pages, local assets, 6 legacy redirects, {len(fields)} field redirects and metadata, JavaScript syntax')
