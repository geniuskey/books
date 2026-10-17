import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../js/feedback-owner.js', import.meta.url), 'utf8');
function open(storage, blocked = false) {
  const context = vm.createContext({ crypto, Uint8Array, localStorage: {
    getItem(key) { if (blocked) throw Error(); return storage.get(key); },
    setItem(key, value) { if (blocked) throw Error(); storage.set(key, value); },
  } });
  vm.runInContext(source, context);
  return context.FeedbackOwner;
}
test('private capability persists before submission, is reused after navigation, and resets with browser data', () => {
  const storage = new Map();
  const first = open(storage);
  assert.equal(first.headers()['X-Feedback-Owner'], undefined);
  const key = first.headers(true)['X-Feedback-Owner'];
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(first.isPersistent(), true);
  assert.equal(open(storage).headers()['X-Feedback-Owner'], key);
  assert.equal(first.headers(true)['X-Feedback-Owner'], key);
  assert.notEqual(open(new Map()).headers(true)['X-Feedback-Owner'], key);
  storage.clear();
  assert.equal(first.headers()['X-Feedback-Owner'], undefined);
  assert.notEqual(first.headers(true)['X-Feedback-Owner'], key);
});
test('unavailable storage keeps the capability only in memory and reports that limitation', () => {
  const page = open(new Map(), true);
  const key = page.headers(true)['X-Feedback-Owner'];
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(page.headers()['X-Feedback-Owner'], key);
  assert.equal(page.isPersistent(), false);
  assert.equal(open(new Map(), true).headers()['X-Feedback-Owner'], undefined);
});
