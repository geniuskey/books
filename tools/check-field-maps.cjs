/* Validate the undirected editorial graph without requiring sibling checkouts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/books.json'), 'utf8'));
const books = new Map(data.books.map(book => [book.id, book]));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/field-maps.js'), 'utf8'), context);
const { FIELD_MAPS: maps, FIELD_MAP_CROSS_LINKS: crossLinks } = context.window;
const pairs = new Set();
let localCount = 0;
function checkLink(link, field) {
  assert.equal(link.length, 3, 'A connection needs two books and a reason');
  const [from, to, reason] = link;
  assert(books.has(from) && books.has(to), `Unknown book: ${from}, ${to}`);
  assert.notEqual(from, to, `Self connection: ${from}`);
  assert(typeof reason === 'string' && reason.trim(), `Missing reason: ${from}, ${to}`);
  const key = [from, to].sort().join(':');
  assert(!pairs.has(key), `Duplicate connection: ${key}`);
  pairs.add(key);
  if (field) {
    assert.equal(books.get(from).field, field, `Wrong field: ${from}`);
    assert.equal(books.get(to).field, field, `Wrong field: ${to}`);
  } else {
    assert.notEqual(books.get(from).field, books.get(to).field, `Not a cross-field connection: ${key}`);
  }
}
for (const field of data.fields) {
  const map = maps[field.id];
  assert(map, `Missing map: ${field.id}`);
  const members = data.books.filter(book => book.field === field.id);
  const assigned = field.stages
    ? field.stages.flatMap(stage => members.filter(book => book.stage === stage.id).map(book => book.id))
    : (map.groups || []).flatMap(group => group[3]);
  assert.equal(new Set(assigned).size, assigned.length, `Duplicate group membership: ${field.id}`);
  assert.deepEqual([...assigned].sort(), members.map(book => book.id).sort(), `Incomplete groups: ${field.id}`);
  for (const link of map.links || []) { checkLink(link, field.id); localCount++; }
}
for (const link of crossLinks) checkLink(link);
console.log(`Knowledge maps OK: ${books.size} books, ${localCount} local + ${crossLinks.length} cross-field connections`);
