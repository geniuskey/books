#!/usr/bin/env python3
"""Keep legacy field URLs pointing to the knowledge atlas."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
catalog = json.loads((ROOT / 'data/books.json').read_text())
fields = catalog['fields']
aliases = catalog.get('fieldAliases', {})
template = (ROOT / 'tools/templates/field.html').read_text()
base = 'https://books.euiyun.com'


def redirect_page(field=None):
    field_id = field['id'] if field else ''
    target = '/paths/?view=map' + ('&field=' + field_id if field_id else '')
    script = '''
(function () {
  const params = new URLSearchParams(location.search);
  const fields = FIELD_IDS;
  const aliases = FIELD_ALIASES;
  for (const key of ["f", "field"]) {
    if (Object.hasOwn(aliases, params.get(key))) params.set(key, aliases[params.get(key)]);
  }
  const field = FIXED_FIELD || (fields.includes(params.get("f")) ? params.get("f") : fields.includes(params.get("field")) ? params.get("field") : "");
  params.delete("f");
  params.set("view", "map");
  if (field) params.set("field", field); else params.delete("field");
  location.replace("/paths/?" + params + location.hash);
})();
'''.replace('FIELD_IDS', json.dumps([item['id'] for item in fields])).replace('FIXED_FIELD', json.dumps(field_id)).replace('FIELD_ALIASES', json.dumps(aliases))
    return template.replace('{{TITLE}}', html.escape((field['name'] + ' 지식 지도' if field else '지식 지도') + ' · Books')) \
        .replace('{{TARGET}}', html.escape(target, quote=True)).replace('{{REDIRECT}}', script)


for field in fields:
    path = ROOT / 'field' / field['id'] / 'index.html'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(redirect_page(field))
for old, new in aliases.items():
    (ROOT / 'field' / old / 'index.html').write_text(redirect_page(next(f for f in fields if f['id'] == new)))
(ROOT / 'field/index.html').write_text(redirect_page())
urls = [base + '/', *(base + '/' + name + '/' for name in ('feedback', 'library', 'paths', 'roadmap', 'simulators'))]
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>' + url + '</loc></url>\n' for url in urls) + '</urlset>\n')
print(f'Built {len(fields) + len(aliases) + 1} legacy map redirects and sitemap')
