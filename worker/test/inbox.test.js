import { test, mock, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker from '../index.js';

const origin = 'https://books.euiyun.com';
const client = 'test-client.apps.googleusercontent.com';
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'test-google-key', alg: 'RS256', use: 'sig' };
mock.method(globalThis, 'fetch', async (url) => {
  assert.equal(String(url), 'https://www.googleapis.com/oauth2/v3/certs');
  return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Content-Type': 'application/json' } });
});
after(() => mock.restoreAll());

async function token(claims = {}, key = privateKey) {
  return new SignJWT({ email: 'geniuskey@gmail.com', email_verified: true, ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-google-key' })
    .setIssuer(claims.iss || 'https://accounts.google.com').setAudience(claims.aud || client)
    .setSubject('google-user').setIssuedAt().setExpirationTime(claims.exp || '1h').sign(key);
}
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_feedback.sql', import.meta.url), 'utf8'));
  const legacy = crypto.randomUUID();
  db.prepare('INSERT INTO feedback(id,type,message) VALUES (?, ?, ?)').run(legacy, 'cheer', '기존 비공개 글');
  db.exec(readFileSync(new URL('../migrations/0002_visibility.sql', import.meta.url), 'utf8'));
  const publicId = crypto.randomUUID();
  const hiddenId = crypto.randomUUID();
  const insert = db.prepare('INSERT INTO feedback(id,type,message,visibility,is_hidden,page_url) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run(publicId, 'request', '<script>alert(1)</script>', 'public', 0, 'https://memorybook.euiyun.com/');
  insert.run(hiddenId, 'cheer', '숨긴 공개 글', 'public', 1, '');
  const env = {
    ALLOWED_ORIGINS: origin, GOOGLE_CLIENT_ID: client,
    INBOX_REQUESTS: { limit: async () => ({ success: true }) },
    DB: { prepare: sql => ({ bind: (...args) => ({
      all: async () => ({ results: db.prepare(sql).all(...args) }),
      run: async () => ({ meta: { changes: db.prepare(sql).run(...args).changes } }),
    }) }) },
  };
  const request = (path, credential, options = {}) => worker.fetch(new Request(`https://test.example${path}`, {
    ...options, headers: { Origin: origin, ...(credential ? { Authorization: `Bearer ${credential}` } : {}), ...options.headers },
  }), env);
  return { db, env, request, legacy, publicId, hiddenId };
}

test('public API returns only visible public rows, never private columns or old private messages', async () => {
  const { db, request, publicId, legacy } = setup();
  const response = await request('/api/feedback/public?scope=all');
  assert.equal(response.status, 200);
  const { items } = await response.json();
  assert.deepEqual(items.map(i => i.id), [publicId]);
  assert.ok(!Object.hasOwn(items[0], 'page_url'));
  assert.ok(!Object.hasOwn(items[0], 'read_at'));
  assert.equal(db.prepare('SELECT visibility FROM feedback WHERE id=?').get(legacy).visibility, 'private');
  db.close();
});

test('only Google-signed, unexpired, correct-audience, verified admin email tokens grant access', async () => {
  const { db, request, env } = setup();
  const alternate = await generateKeyPair('RS256');
  const rejected = [undefined, 'forged', await token({ email: 'reader@gmail.com' }), await token({ email_verified: false }),
    await token({ aud: 'other-client.apps.googleusercontent.com' }), await token({ iss: 'https://evil.example' }),
    await token({ exp: Math.floor(Date.now() / 1000) - 60 }), await token({}, alternate.privateKey)];
  for (const credential of rejected) {
    const response = await request('/api/admin/feedback', credential);
    assert.equal(response.status, 401);
    assert.ok(!(await response.text()).includes('기존 비공개 글'));
  }
  const response = await request('/api/admin/feedback', await token());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).items.length, 3);
  env.GOOGLE_CLIENT_ID = '';
  assert.equal((await request('/api/admin/feedback', await token())).status, 503);
  db.close();
});

test('authenticated read/hide/restore actions and filtering preserve writer privacy', async () => {
  const { db, request, legacy, publicId } = setup();
  const credential = await token();
  const change = (id, action, auth = credential) => request(`/api/admin/feedback/${id}`, auth, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  assert.equal((await change(legacy, 'read', null)).status, 401);
  assert.equal((await change(legacy, 'read')).status, 200);
  let response = await request('/api/admin/feedback?scope=unread', credential);
  assert.equal((await response.json()).items.length, 2);
  assert.equal((await change(legacy, 'unread')).status, 200);
  assert.equal((await change(publicId, 'hide')).status, 200);
  response = await request('/api/feedback/public');
  assert.equal((await response.json()).items.length, 0);
  assert.equal((await change(publicId, 'restore')).status, 200);
  assert.equal((await change(legacy, 'publish')).status, 400);
  assert.equal(db.prepare('SELECT visibility FROM feedback WHERE id=?').get(legacy).visibility, 'private');
  assert.equal((await request('/api/admin/feedback?scope=private', credential)).status, 200);
  assert.equal((await request('/api/feedback/public?page=-1')).status, 400);
  assert.equal((await request('/api/feedback/public?type=invalid')).status, 400);
  db.close();
});

test('pagination and CORS for Authorization headers', async () => {
  const { db, request } = setup();
  for (let i = 0; i < 24; i++) db.prepare('INSERT INTO feedback(id,type,message,visibility) VALUES (?,?,?,?)').run(crypto.randomUUID(), 'cheer', `응원 ${i}`, 'public');
  const first = await (await request('/api/feedback/public')).json();
  const second = await (await request('/api/feedback/public?page=1')).json();
  assert.equal(first.items.length, 20); assert.equal(first.hasMore, true);
  assert.equal(second.items.length, 5); assert.equal(second.hasMore, false);
  const ids = new Set([...first.items, ...second.items].map(i => i.id));
  assert.equal(ids.size, 25);
  const preflight = await request('/api/admin/feedback', undefined, { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.ok(preflight.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
  db.close();
});
