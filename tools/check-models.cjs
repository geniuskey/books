/* Run reference cases against the books' actual model helpers. No dependencies. */
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const records = JSON.parse(readFileSync(resolve(root, 'data/model-validation.json'), 'utf8')).experiments;
let checked = 0;
let skipped = 0;
for (const [id, record] of Object.entries(records)) {
  const sourcePath = resolve(root, '..', record.bookId, record.sourceFile);
  if (!existsSync(sourcePath)) { skipped++; continue; }
  const source = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  const hash = createHash('sha256').update(source).digest('hex');
  assert.equal(hash, record.sourceSha256, `${id}: model source changed; rerun reference review`);
  const window = {};
  const document = { readyState: 'loading', addEventListener() {} };
  vm.runInNewContext(source, { window, document }, { filename: sourcePath, timeout: 5000 });
  const api = record.bookId === 'yieldbook' ? window.WM.Y : window.CB;
  for (const example of record.cases) {
    assert.equal(typeof api[example.function], 'function', `${id}: missing ${example.function}`);
    const actual = api[example.function](...example.args);
    if (typeof example.expected === 'number') {
      assert.ok(Math.abs(actual - example.expected) < 1e-12, `${id}: ${example.function}(${example.args}) = ${actual}, expected ${example.expected}`);
    } else {
      assert.equal(actual, example.expected, `${id}: ${example.function}(${example.args})`);
    }
    checked++;
  }
  if (record.bookId === 'yieldbook') {
    for (const name of ['poisson', 'murphy', 'seeds']) {
      let previous = 1;
      for (const lambda of [0, 0.5, 1, 3, 4]) {
        const value = api[name](lambda);
        assert.ok(value >= 0 && value <= previous, `${id}: ${name} must stay in [0, 1] and decrease with defects`);
        previous = value;
        checked++;
      }
    }
    for (const lambda of [0, 0.5, 1, 3, 4]) {
      assert.ok(Math.abs(api.negbin(lambda, 1) - api.seeds(lambda)) < 1e-12, `${id}: alpha=1 must equal Seeds`);
      assert.ok(Math.abs(api.negbin(lambda, 1e6) - api.poisson(lambda)) < 1e-5, `${id}: large alpha must approach Poisson`);
      checked += 2;
    }
  }
}
console.log(`Model reference cases: ${checked} passed; ${skipped} book sources unavailable`);
