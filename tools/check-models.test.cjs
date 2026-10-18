const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

test('UI edits pass; model edits and wrong reference values fail', () => {
  const root = mkdtempSync(join(tmpdir(), 'model-check-'));
  try {
    for (const dir of ['books/tools', 'books/data', 'computerbook/js']) mkdirSync(join(root, dir), { recursive: true });
    const checker = join(root, 'books/tools/check-models.cjs');
    copyFileSync(resolve(__dirname, 'check-models.cjs'), checker);
    const original = JSON.parse(readFileSync(resolve(__dirname, '../data/model-validation.json')));
    const record = original.experiments['computerbook/bits/sim-bin'];
    const bin = '(n, bits = 8) => ((n >>> 0) & (bits >= 32 ? 0xffffffff : (1 << bits) - 1)).toString(2).padStart(bits, "0")';
    const hex = '(n, digits = 2) => (n >>> 0).toString(16).toUpperCase().padStart(digits, "0")';
    const source = `window.CB = {bin: ${bin}, hex: ${hex}};`;
    const sourcePath = join(root, 'computerbook/js/common.js');
    const recordPath = join(root, 'books/data/model-validation.json');
    const save = () => writeFileSync(recordPath, JSON.stringify({ experiments: { 'computerbook/bits/sim-bin': record } }));
    const run = () => spawnSync(process.execPath, [checker], { encoding: 'utf8' });
    save();
    writeFileSync(sourcePath, source);
    assert.equal(run().status, 0);
    writeFileSync(sourcePath, source + '\n// Changed UI\nconst script = document.createElement("script"); script.src = new URL("ui.js", document.currentScript.src).href; document.head.append(script);');
    assert.equal(run().status, 0);
    // Even a behavior-preserving model edit still requires review.
    writeFileSync(sourcePath, source.replace('(n >>> 0).toString', '(n >>> 0 >>> 0).toString'));
    const changed = run();
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, /hex model function changed/);
    // A reviewed hash must never bypass the independent reference cases.
    const wrong = '() => "wrong"';
    writeFileSync(sourcePath, `window.CB = {bin: ${bin}, hex: ${wrong}};`);
    record.functionSha256.hex = createHash('sha256').update(wrong).digest('hex');
    save();
    const failed = run();
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /hex\(0,2\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
