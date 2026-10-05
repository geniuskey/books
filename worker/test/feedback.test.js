import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../index.js';

const origin = 'https://books.euiyun.com';
const payload = () => ({ id: crypto.randomUUID(), type: 'cheer', message: '좋은 책 감사합니다!', nickname: '' });
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_feedback.sql', import.meta.url), 'utf8'));
  const env = {
    ALLOWED_ORIGINS: origin,
    SUBMISSIONS: { limit: async () => ({ success: true }) },
    TOTAL_SUBMISSIONS: { limit: async () => ({ success: true }) },
    DB: { prepare: sql => ({ bind: (...args) => ({ run: async () => db.prepare(sql).run(...args) }) }) },
  };
  const post = (body, headers = {}, path = '/api/feedback') => worker.fetch(new Request(`https://test.example${path}`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  }), env);
  return { db, env, post };
}

test('all three types store correctly; retries do not duplicate a message', async () => {
  const { db, post } = setup();
  for (const type of ['error', 'request', 'cheer']) {
    const data = { ...payload(), type, nickname: "독자'); DROP TABLE feedback;--" };
    assert.equal((await post(data)).status, 201);
    assert.equal((await post(data)).status, 201);
  }
  assert.equal(db.prepare('SELECT count(*) AS count FROM feedback').get().count, 3);
  assert.equal(db.prepare('SELECT message FROM feedback LIMIT 1').get().message, '좋은 책 감사합니다!');
  db.close();
});

test('invalid fields, book references, page URLs and honeypot are rejected', async () => {
  const { db, post } = setup();
  const variants = [
    { type: 'admin' }, { id: 'invalid' }, { message: '  ' }, { message: 'x'.repeat(3001) },
    { nickname: 'x'.repeat(41) }, { message: 123 }, { bookId: 'unknown' },
    { pageUrl: 'https://memorybook.euiyun.com/' },
    { bookId: 'memorybook', pageUrl: 'https://evil.example/' },
    { bookId: 'memorybook', pageUrl: 'https://user:pass@memorybook.euiyun.com/' },
    { website: 'spam.example' },
  ];
  for (const variant of variants) assert.equal((await post({ ...payload(), ...variant })).status, 400);
  assert.equal((await post({ ...payload(), bookId: 'memorybook', pageUrl: 'https://memorybook.euiyun.com/chapters/hbm.html#sim-h3' })).status, 201);
  assert.equal(db.prepare('SELECT count(*) AS count FROM feedback').get().count, 1);
  db.close();
});

test('origin, content-type, method, route and body size boundaries', async () => {
  const { db, env, post } = setup();
  assert.equal((await post(payload(), { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(payload(), { Origin: '' })).status, 403);
  assert.equal((await post(payload(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(payload(), {}, '/other')).status, 404);
  assert.equal((await post({ ...payload(), message: 'x'.repeat(20000) })).status, 413);
  const malformed = await worker.fetch(new Request('https://test.example/api/feedback', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{' }), env);
  assert.equal(malformed.status, 400);
  const get = await worker.fetch(new Request('https://test.example/api/feedback', { headers: { Origin: origin } }), env);
  assert.equal(get.status, 405);
  const options = await worker.fetch(new Request('https://test.example/api/feedback', { method: 'OPTIONS', headers: { Origin: origin } }), env);
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(get.headers.get('Cache-Control'), 'no-store');
  db.close();
});

test('rate limiting and database failure never report successful receipt', async () => {
  const { db, env, post } = setup();
  env.SUBMISSIONS.limit = async () => ({ success: false });
  const limited = await post(payload());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  env.SUBMISSIONS.limit = async () => ({ success: true });
  env.DB.prepare = () => { throw new Error('private database detail'); };
  const failed = await post(payload());
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('private database detail'));
  assert.equal(db.prepare('SELECT count(*) AS count FROM feedback').get().count, 0);
  db.close();
});
