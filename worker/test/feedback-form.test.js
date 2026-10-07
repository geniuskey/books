import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

async function setup(responses, endpoint = 'https://feedback.example/api/feedback') {
  const handlers = {};
  const fields = [];
  for (const name of ['type', 'nickname', 'message', 'bookId', 'website', 'visibility']) {
    const field = { value: '', disabled: false, add() {}, focus() {} };
    fields.push(field);
    fields[name] = field;
  }
  fields.visibility.value = 'private';
  const form = { elements: fields, addEventListener: (name, fn) => { handlers[name] = fn; }, reportValidity: () => true };
  const nodes = { 'feedback-form': form, 'feedback-status': { dataset: {} }, 'feedback-submit': { disabled: true }, 'feedback-count': {}, 'feedback-compose': { hidden: false } };
  const summary = {};
  const note = {};
  const alternative = { open: false, querySelector: selector => (selector === 'summary' ? summary : note) };
  const selectors = { '.feedback-inbox': { hidden: false }, '.feedback-alternative': alternative };
  const submissions = [];
  const fetch = async (url, options) => {
    if (!options?.body) return { ok: true, json: async () => ({ endpoint }) };
    submissions.push(JSON.parse(options.body));
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return { ok: response.ok, json: async () => response };
  };
  vm.runInNewContext(readFileSync(new URL('../../js/feedback.js', import.meta.url), 'utf8'), {
    EB: { start: (_, fn) => fn({ books: [] }) },
    location: { search: '' }, document: { getElementById: id => nodes[id], querySelector: selector => selectors[selector], querySelectorAll: () => [] },
    URL, URLSearchParams, Option: class {}, crypto, fetch, AbortSignal, Error, TypeError,
  });
  await new Promise(resolve => setImmediate(resolve));
  return { fields, nodes, selectors, submissions, submit: () => handlers.submit({ preventDefault() {} }) };
}

test('a rejected request keeps the draft, retry uses the same ID, success clears it', async () => {
  const { fields, nodes, submissions, submit } = await setup([{ ok: false, error: '잠시 후 다시 보내 주세요.' }, { ok: true }]);
  fields.type.value = 'cheer';
  fields.message.value = '응원합니다';
  assert.equal(nodes['feedback-submit'].disabled, false);
  await submit();
  assert.equal(fields.message.value, '응원합니다');
  assert.equal(nodes['feedback-status'].dataset.state, 'error');
  await submit();
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0].id, submissions[1].id);
  assert.equal(submissions[1].type, 'cheer');
  assert.equal(fields.message.value, '');
  assert.ok(nodes['feedback-status'].textContent.includes('응원 감사합니다'));
  assert.ok(fields.every(field => !field.disabled));
});

test('a network failure keeps the draft and switches to GitHub only', async () => {
  const { fields, nodes, selectors, submissions, submit } = await setup([new TypeError('network')]);
  fields.type.value = 'request';
  fields.message.value = '의견';
  await submit();
  assert.equal(fields.message.value, '의견');
  assert.equal(nodes['feedback-compose'].hidden, true);
  assert.equal(selectors['.feedback-inbox'].hidden, true);
  assert.equal(selectors['.feedback-alternative'].open, true);
  assert.equal(nodes['feedback-submit'].disabled, true);
  await submit();
  assert.equal(submissions.length, 1);
});

test('editing a failed draft generates a new ID and an unconfigured endpoint blocks sending', async () => {
  const configured = await setup([{ ok: false, error: '잠시 후 다시 보내 주세요.' }, { ok: true }]);
  configured.fields.type.value = 'request';
  configured.fields.message.value = '첫 의견';
  await configured.submit();
  configured.fields.message.value = '수정한 의견';
  await configured.submit();
  assert.notEqual(configured.submissions[0].id, configured.submissions[1].id);
  const unconfigured = await setup([], '');
  assert.equal(unconfigured.nodes['feedback-submit'].disabled, true);
  assert.equal(unconfigured.nodes['feedback-compose'].hidden, true);
  assert.equal(unconfigured.selectors['.feedback-alternative'].open, true);
  await unconfigured.submit();
  assert.equal(unconfigured.submissions.length, 0);
});
