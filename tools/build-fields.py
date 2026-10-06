#!/usr/bin/env python3
"""Build static field pages and the legacy query route from the catalog."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT / 'data/books.json').read_text())
fields = catalog['fields']
template = (ROOT / 'tools/templates/field.html').read_text()
base = 'https://books.euiyun.com'

def page(title, description, route):
    source = re.sub(r'<title>.*?</title>', '<title>' + html.escape(title) + '</title>', template)
    for key, value in [('name="description"', description), ('property="og:title"', title), ('property="og:description"', description), ('property="og:url"', base + route)]:
        source = re.sub(r'(<meta ' + key + r' content=")[^"]*(">)', lambda m: m[1] + html.escape(value, quote=True) + m[2], source)
    source = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="' + base + route + '">', source)
    data = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': title, 'description': description, 'url': base + route, 'inLanguage': 'ko', 'isPartOf': {'@type': 'WebSite', 'name': 'Books · 인터랙티브 교과서 시리즈', 'url': base + '/'}}
    return re.sub(r'<script type="application/ld\+json">.*?</script>', lambda _: '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>', source)

for field in fields:
    route = '/field/' + field['id'] + '/'
    source = page(field['name'] + ' · Books', field['desc'], route)
    source = source.replace('<body>', '<body data-field="' + field['id'] + '">')
    source = source.replace('<h1 id="flow-title"></h1>', '<h1 id="flow-title">' + html.escape(field['name']) + ' 지식 지도</h1>')
    source = source.replace('<p id="flow-desc"></p>', '<p id="flow-desc">' + html.escape(field['desc']) + '</p>')
    path = ROOT / 'field' / field['id'] / 'index.html'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(source)

source = page('분야 찾기 · Books', '관심 있는 분야를 골라 지식 지도와 교과서를 둘러보세요.', '/field/')
source = source.replace('<script src="/js/field-maps.js" defer></script>\n<script src="/js/field.js" defer></script>', '<script src="/js/field-index.js" defer></script>')
# Resolve legacy query links before analytics loads; preserve unrelated context and fragments.
redirect = '''<script>
(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("f");
  const fields = FIELD_IDS;
  if (!fields.includes(id)) return;
  params.delete("f");
  location.replace("/field/" + encodeURIComponent(id) + "/" + (params.size ? "?" + params : "") + location.hash);
})();
</script>'''.replace('FIELD_IDS', json.dumps([f['id'] for f in fields]))
source = source.replace('<meta name="viewport"', redirect + '\n<meta name="viewport"', 1)
links = ''.join('<article class="card"><div class="body"><h2><a href="/field/' + f['id'] + '/">' + html.escape(f['name']) + ' →</a></h2><p>' + html.escape(f['desc']) + '</p></div></article>\n' for f in fields)
main = '<main><section class="page-head"><div class="wrap"><h1>분야 찾기</h1><p class="lead">관심 있는 분야를 골라 지식 지도와 교과서를 둘러보세요.</p></div></section><section class="block"><div class="wrap grid">' + links + '</div></section></main>'
source = re.sub(r'<main>.*?</main>', lambda _: main, source, flags=re.S)
(ROOT / 'field/index.html').write_text(source)
urls = [base + '/', *(base + '/' + n + '/' for n in ('feedback', 'field', 'library', 'paths', 'roadmap', 'simulators')), *(base + '/field/' + f['id'] + '/' for f in fields)]
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>' + url + '</loc></url>\n' for url in urls) + '</urlset>\n')
print(f'Built {len(fields)} field pages, field index, and sitemap')
