import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

class Element {
  constructor() { this.children = []; this.events = {}; this.value = ''; this.hidden = false; this.textContent = ''; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, fn) { this.events[name] = fn; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup({ deferAdmin = false, authorized = true, isAdmin = 0, reactionFetch } = {}) {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  let callback, release, adminRequests = 0;
  const publicItem = { is_admin: isAdmin, id: 'public', type: 'cheer', nickname: '독자', message: '<img src=x onerror=alert(1)>', created_at: '2026-10-05T00:00:00Z' };
  const privateItem = { ...publicItem, id: 'private', message: '비공개 내용', visibility: 'private' };
  const fetch = async (url, options) => {
    if (/\/api\/feedback\/public\//.test(url)) return reactionFetch(url, options);
    if (options.headers.Authorization) {
      if (!authorized) return { ok: false, status: 401, json: async () => ({ error: '관리자가 아닙니다.' }) };
      adminRequests++;
      if (deferAdmin && adminRequests === 2) await new Promise(resolve => { release = resolve; });
      return { ok: true, json: async () => ({ items: [privateItem], hasMore: false }) };
    }
    return { ok: true, json: async () => ({ items: [publicItem], hasMore: false }) };
  };
  const head = { append: script => script.onload() };
  const google = { accounts: { id: { initialize: options => { callback = options.callback; }, renderButton() {}, disableAutoSelect() {} } } };
  const context = vm.createContext({ document: { getElementById: get, createElement: () => new Element(), head }, fetch, google, crypto, URL, URLSearchParams, AbortSignal, setTimeout: () => 1, clearTimeout() {} });
  vm.runInContext(readFileSync(new URL('../../js/feedback-inbox.js', import.meta.url), 'utf8'), context);
  context.FeedbackInbox.start({ endpoint: 'https://feedback.example/api/feedback', googleClientId: 'client' }, { books: [] });
  await tick();
  get('admin-login').open = true;
  get('admin-login').events.toggle();
  return { get, api: context.FeedbackInbox, signIn: () => callback({ credential: 'signed-token' }), release: () => release?.() };
}

test('reader messages are literal text, and a rejected Google account never enters admin mode', async () => {
  const { get, signIn } = await setup({ authorized: false });
  const message = get('inbox-list').children[0].children[1];
  assert.equal(message.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(message.children.length, 0);
  await signIn();
  assert.equal(get('admin-status').textContent, '관리자가 아닙니다.');
  assert.equal(get('inbox-list').children[0].children[1].textContent, '<img src=x onerror=alert(1)>');
});

test('logging out discards an in-flight private response and replaces private DOM content', async () => {
  const { get, signIn, release } = await setup({ deferAdmin: true });
  const pending = signIn();
  await tick();
  assert.equal(get('admin-login').hidden, true);
  get('admin-logout').events.click();
  await tick();
  release(); await pending;
  assert.equal(get('admin-login').hidden, false);
  assert.equal(get('admin-session').hidden, true);
  assert.ok(get('inbox-list').children.every(card => card.children[1].textContent !== '비공개 내용'));
});

test('likes toggle with the same visitor ID and recover from a failed request', async () => {
  const requests = [];
  let fail = false;
  const { get } = await setup({ reactionFetch: async (url, options) => {
    requests.push({ url, ...options });
    if (fail) throw new TypeError('연결 실패');
    return { ok: true, json: async () => ({ count: options.method === 'PUT' ? 1 : 0, liked: options.method === 'PUT' }) };
  } });
  const area = get('inbox-list').children[0].children[2];
  const like = area.children[0];
  assert.equal(like['aria-pressed'], 'false');
  await like.events.click();
  assert.equal(like['aria-pressed'], 'true'); assert.equal(like.textContent, '♥ 좋아요 1');
  fail = true; await like.events.click();
  assert.equal(like['aria-pressed'], 'true'); assert.equal(like.disabled, false);
  fail = false; await like.events.click();
  assert.equal(like['aria-pressed'], 'false');
  assert.deepEqual(requests.map(r => r.method), ['PUT', 'DELETE', 'DELETE']);
  assert.equal(new Set(requests.map(r => JSON.parse(r.body).visitorId)).size, 1);
  assert.ok(requests.every(r => !r.headers.Authorization));
});

test('comments load on demand as literal text and failed submissions preserve the draft and ID', async () => {
  const writes = [];
  let fail = true, reads = 0;
  const { get } = await setup({ reactionFetch: async (url, options) => {
    if (options.method === 'POST') {
      writes.push(JSON.parse(options.body));
      if (fail) throw new TypeError('연결 실패');
      return { ok: true, json: async () => ({ ok: true }) };
    }
    reads++;
    return { ok: true, json: async () => ({ items: [{ nickname: '<b>독자</b>', message: '<script>unsafe()</script>', created_at: '2026-10-17T00:00:00Z' }], hasMore: false }) };
  } });
  assert.equal(reads, 0);
  const thread = get('inbox-list').children[0].children[2].children[2];
  thread.open = true; thread.events.toggle(); await tick();
  assert.equal(reads, 1);
  assert.equal(thread.children[1].children[0].children[1].textContent, '<script>unsafe()</script>');
  assert.equal(thread.children[1].children[0].children[1].children.length, 0);
  const form = thread.children[4], message = form.children[1].children[0];
  message.value = '제 댓글입니다';
  await form.events.submit({ preventDefault() {} });
  assert.equal(message.value, '제 댓글입니다'); assert.equal(form.children[4].disabled, false);
  fail = false; await form.events.submit({ preventDefault() {} });
  assert.equal(writes[0].id, writes[1].id); assert.equal(message.value, '');
  assert.equal(thread.children[0].textContent, '댓글 1');
  assert.equal(reads, 2);
});


test('verified authors have a distinct badge and credentials clear on logout', async () => {
  const { get, api, signIn } = await setup({ isAdmin: 1 });
  const author = get('inbox-list').children[0].children[0].children[1];
  assert.equal(author.textContent, '관리자');
  assert.equal(author.className, 'author-admin');
  assert.equal(api.authHeaders().Authorization, undefined);
  await signIn();
  assert.equal(api.authHeaders().Authorization, 'Bearer signed-token');
  get('admin-logout').events.click();
  assert.equal(api.authHeaders().Authorization, undefined);
  const reader = await setup();
  assert.equal(reader.get('inbox-list').children[0].children[0].children[1].className, undefined);
});
