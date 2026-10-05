import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

class Element {
  constructor() { this.children = []; this.events = {}; this.value = ''; this.hidden = false; this.textContent = ''; }
  addEventListener(name, fn) { this.events[name] = fn; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup({ deferAdmin = false, authorized = true } = {}) {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  let callback, release, adminRequests = 0;
  const publicItem = { id: 'public', type: 'cheer', nickname: '독자', message: '<img src=x onerror=alert(1)>', created_at: '2026-10-05T00:00:00Z' };
  const privateItem = { ...publicItem, id: 'private', message: '비공개 내용', visibility: 'private' };
  const fetch = async (url, options) => {
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
  const context = vm.createContext({ document: { getElementById: get, createElement: () => new Element(), head }, fetch, google, URL, URLSearchParams, AbortSignal, setTimeout: () => 1, clearTimeout() {} });
  vm.runInContext(readFileSync(new URL('../../js/feedback-inbox.js', import.meta.url), 'utf8'), context);
  context.FeedbackInbox.start({ endpoint: 'https://feedback.example/api/feedback', googleClientId: 'client' }, { books: [] });
  await tick();
  get('admin-login').open = true;
  get('admin-login').events.toggle();
  return { get, signIn: () => callback({ credential: 'signed-token' }), release: () => release?.() };
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
