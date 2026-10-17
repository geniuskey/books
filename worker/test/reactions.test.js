import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../index.js';

function setup() {
  const db = new DatabaseSync(':memory:');
  for (const migration of ['0001_feedback', '0002_visibility', '0003_reactions', '0004_admin_authors']) db.exec(readFileSync(new URL(`../migrations/${migration}.sql`, import.meta.url), 'utf8'));
  const id = crypto.randomUUID(), privateId = crypto.randomUUID(), hiddenId = crypto.randomUUID();
  const insert = db.prepare('INSERT INTO feedback(id,type,message,visibility,is_hidden) VALUES (?,\'cheer\',\'응원\',?,?)');
  insert.run(id, 'public', 0); insert.run(privateId, 'private', 0); insert.run(hiddenId, 'public', 1);
  const env = {
    ALLOWED_ORIGINS: 'https://books.euiyun.com',
    SUBMISSIONS: { limit: async () => ({ success: true }) },
    TOTAL_SUBMISSIONS: { limit: async () => ({ success: true }) },
    INBOX_REQUESTS: { limit: async () => ({ success: true }) },
    DB: { prepare: sql => ({ bind: (...args) => ({
      all: async () => ({ results: db.prepare(sql).all(...args) }),
      run: async () => ({ meta: { changes: db.prepare(sql).run(...args).changes } }),
    }) }) },
  };
  const request = (path, method = 'GET', data, headers = {}) => worker.fetch(new Request(`https://test.example${path}`, {
    method, headers: { Origin: env.ALLOWED_ORIGINS, 'Content-Type': 'application/json', ...headers },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  }), env);
  return { db, env, request, id, privateId, hiddenId };
}

test('likes are idempotent per visitor, persist in the inbox, and can be removed', async () => {
  const { db, request, id } = setup();
  const path = `/api/feedback/${id}/likes`, visitorId = crypto.randomUUID();
  for (let i = 0; i < 2; i++) {
    const response = await request(path, 'PUT', { visitorId });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { count: 1, liked: true });
  }
  const other = crypto.randomUUID();
  await request(path, 'PUT', { visitorId: other });
  const inbox = await (await request(`/api/feedback/public?visitorId=${visitorId}`)).json();
  assert.equal(inbox.items.find(item => item.id === id).like_count, 2); assert.equal(inbox.items.find(item => item.id === id).liked, 1);
  assert.ok(!JSON.stringify(inbox).includes(other));
  for (let i = 0; i < 2; i++) assert.deepEqual(await (await request(path, 'DELETE', { visitorId })).json(), { count: 1, liked: false });
  assert.deepEqual(await (await request(`${path}?visitorId=${other}`)).json(), { count: 1, liked: true });
  db.close();
});

test('comments preserve literal text, retry once, and paginate without overlap', async () => {
  const { db, request, id } = setup();
  const path = `/api/feedback/${id}/comments`;
  const comment = { id: crypto.randomUUID(), nickname: '<img src=x>', message: '<script>alert(1)</script>' };
  for (let i = 0; i < 2; i++) assert.equal((await request(path, 'POST', comment)).status, 201);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM feedback_comments').get().count, 1);
  for (let i = 0; i < 24; i++) await request(path, 'POST', { id: crypto.randomUUID(), message: `댓글 ${i}` });
  const first = await (await request(path)).json(), second = await (await request(`${path}?page=1`)).json();
  assert.equal(first.items.length, 20); assert.equal(first.hasMore, true);
  assert.equal(second.items.length, 5); assert.equal(second.hasMore, false);
  const all = [...first.items, ...second.items];
  assert.equal(new Set(all.map(item => item.id)).size, 25);
  assert.equal(all.find(item => item.id === comment.id).message, comment.message);
  assert.equal((await (await request('/api/feedback/public')).json()).items.find(item => item.id === id).comment_count, 25);
  db.close();
});

test('private, missing and subsequently private threads cannot be read or changed', async () => {
  const { db, request, id, privateId, hiddenId } = setup();
  await request(`/api/feedback/${id}/comments`, 'POST', { id: crypto.randomUUID(), message: '댓글' });
  db.prepare("UPDATE feedback SET visibility='private' WHERE id=?").run(id);
  for (const parent of [id, privateId, crypto.randomUUID()]) {
    for (const [suffix, method, body] of [
      ['comments', 'GET'], ['comments', 'POST', { id: crypto.randomUUID(), message: '댓글' }],
      [`likes?visitorId=${crypto.randomUUID()}`, 'GET'], ['likes', 'PUT', { visitorId: crypto.randomUUID() }], ['likes', 'DELETE', { visitorId: crypto.randomUUID() }],
    ]) assert.equal((await request(`/api/feedback/${parent}/${suffix}`, method, body)).status, 404);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM feedback_comments').get().count, 1);
  db.close();
});

test('validation, bounded requests, CORS, rate limiting and DB errors fail safely', async () => {
  const { db, env, request, id } = setup();
  const path = `/api/feedback/${id}/comments`;
  for (const data of [null, [], {}, { id: 'invalid', message: '댓글' }, { id: crypto.randomUUID(), message: ' ' }, { id: crypto.randomUUID(), message: 'x'.repeat(1001) }, { id: crypto.randomUUID(), message: '댓글', nickname: 'x'.repeat(41) }, { id: crypto.randomUUID(), message: '댓글', website: 'spam' }]) {
    assert.equal((await request(path, 'POST', data)).status, 400);
  }
  assert.equal((await request(path, 'POST', { message: 'x'.repeat(17000) })).status, 413);
  assert.equal((await request(path, 'POST', {}, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request(path, 'GET', undefined, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request(`${path}?page=-1`)).status, 400);
  assert.equal((await request(`/api/feedback/${id}/likes`, 'PUT', { visitorId: 'invalid' })).status, 400);
  const preflight = await request(`/api/feedback/${id}/likes`, 'OPTIONS');
  assert.equal(preflight.status, 204); assert.ok(preflight.headers.get('Access-Control-Allow-Methods').includes('DELETE'));
  env.SUBMISSIONS.limit = async () => ({ success: false });
  assert.equal((await request(path, 'POST', { id: crypto.randomUUID(), message: '댓글' })).status, 429);
  env.INBOX_REQUESTS.limit = async () => ({ success: false });
  assert.equal((await request(path)).status, 429);
  env.INBOX_REQUESTS.limit = async () => ({ success: true });
  env.DB.prepare = () => { throw new Error('database secret'); };
  const failed = await request(path); assert.equal(failed.status, 503); assert.ok(!(await failed.text()).includes('secret'));
  db.close();
});

test('formerly hidden public posts allow comments and likes', async () => {
  const { db, request, hiddenId } = setup();
  const path = `/api/feedback/${hiddenId}`;
  assert.equal((await request(`${path}/comments`, 'POST', { id: crypto.randomUUID(), message: '댓글' })).status, 201);
  assert.equal((await (await request(`${path}/comments`)).json()).items.length, 1);
  assert.equal((await request(`${path}/likes`, 'PUT', { visitorId: crypto.randomUUID() })).status, 200);
  db.close();
});
