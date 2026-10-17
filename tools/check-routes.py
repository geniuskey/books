#!/usr/bin/env python3
"""Check public routes, local assets, and legacy redirects including map links."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
NAMES = ('feedback', 'field', 'library', 'paths', 'roadmap', 'simulators')
PUBLIC = ('', 'feedback', 'library', 'paths', 'roadmap', 'simulators')


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        self.links.extend(value for key, value in attrs if key in ('href', 'src') and value)


def check_assets(path):
    source = path.read_text()
    parser = Links()
    parser.feed(source)
    route = '/' + str(path.parent.relative_to(ROOT)).strip('.') + '/'
    for link in parser.links:
        url = urlsplit(urljoin('https://books.euiyun.com' + route, link))
        if url.netloc != 'books.euiyun.com':
            continue
        target = ROOT / url.path.lstrip('/')
        if url.path.endswith('/'):
            target /= 'index.html'
        assert target.is_file(), f'{path}: missing {link}'
    assert source.count('static.cloudflareinsights.com/beacon.min.js') == 1, path
    return source


fields = json.loads((ROOT / 'data/books.json').read_text())['fields']
for name in PUBLIC:
    path = ROOT / name / 'index.html'
    source = check_assets(path)
    route = f'/{name}/' if name else '/'
    assert f'href="https://books.euiyun.com{route}"' in source, path

for name in NAMES:
    old = (ROOT / f'{name}.html').read_text()
    script = re.search(r'<script>(.*?)</script>', old, re.S)[1]
    case = '?book=memorybook&page=https%3A%2F%2Fmemorybook.euiyun.com%2Fchapters%2Fhbm.html%23sim-h3'
    test = f'''const vm = require('node:vm');
const assert = require('node:assert/strict');
vm.runInNewContext({json.dumps(script)}, {{location: {{search: {json.dumps(case)}, hash: '#request', replace(value) {{assert.equal(value, {json.dumps('/' + name + '/' + case + '#request')});}}}}}});'''
    subprocess.run(['node', '-e', test], check=True)

for path in (ROOT / 'js').glob('*.js'):
    source = path.read_text()
    assert not re.search(r'(?:href=["\']|href: ["\'])[^"\']*(?:' + '|'.join(NAMES) + r')\.html', source), path
    subprocess.run(['node', '--check', str(path)], check=True)


def check_map_redirect(path, query, expected_field):
    source = check_assets(path)
    assert 'name="robots" content="noindex"' in source, path
    assert 'rel="canonical" href="https://books.euiyun.com/paths/"' in source, path
    script = re.search(r'<script>(.*?)</script>', source, re.S)[1]
    test = f'''const vm = require('node:vm');
const assert = require('node:assert/strict');
vm.runInNewContext({json.dumps(script)}, {{URLSearchParams, location: {{search: {json.dumps(query)}, hash: '#card-statbook', replace(value) {{
  const url = new URL(value, 'https://books.euiyun.com');
  assert.equal(url.pathname, '/paths/');
  assert.equal(url.searchParams.get('view'), 'map');
  assert.equal(url.searchParams.get('field'), {json.dumps(expected_field)});
  assert.equal(url.searchParams.has('f'), false);
  assert.equal(url.searchParams.get('q'), 'a&b');
  assert.equal(url.searchParams.get('book'), 'memorybook');
  assert.equal(url.searchParams.get('page'), 'https://memorybook.euiyun.com/chapters/hbm.html#sim-h3');
  assert.equal(url.hash, '#card-statbook');
}}}}}});'''
    subprocess.run(['node', '-e', test], check=True)


context = '&q=a%26b&book=memorybook&page=https%3A%2F%2Fmemorybook.euiyun.com%2Fchapters%2Fhbm.html%23sim-h3'
for field in fields:
    check_map_redirect(ROOT / 'field' / field['id'] / 'index.html', '?f=unknown' + context, field['id'])
    check_map_redirect(ROOT / 'field/index.html', '?f=' + field['id'] + context, field['id'])
check_map_redirect(ROOT / 'field/index.html', '?f=unknown' + context, None)
check_map_redirect(ROOT / 'field/index.html', '?field=ai' + context, 'computing')
aliases = json.loads((ROOT / 'data/books.json').read_text())['fieldAliases']
for old, new in aliases.items():
    check_map_redirect(ROOT / 'field' / old / 'index.html', '?' + context.lstrip('&'), new)
    check_map_redirect(ROOT / 'field/index.html', '?f=' + old + context, new)
sitemap = (ROOT / 'sitemap.xml').read_text()
expected = {'https://books.euiyun.com' + (f'/{name}/' if name else '/') for name in PUBLIC}
assert set(re.findall(r'<loc>(.*?)</loc>', sitemap)) == expected
print(f'OK: {len(PUBLIC)} public pages, local assets, 6 legacy page redirects, {len(fields) + len(aliases) + 1} map redirects, sitemap, JavaScript syntax')
