import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function render(text) {
  const context = vm.createContext({ URL, document: { createElement: tag => ({ tag }) } });
  vm.runInContext(readFileSync(new URL('../../js/feedback-inbox.js', import.meta.url), 'utf8'), context);
  const children = [];
  const element = { append: child => children.push(child) };
  context.appendFeedbackLinks(element, text);
  return { links: children.filter(child => typeof child !== 'string'), text: element.textContent ?? children.map(child => typeof child === 'string' ? child : child.textContent).join('') };
}

test('links preserve text, queries, fragments, line breaks and balanced parentheses', () => {
  const text = '참고 (https://example.com/a_(b)?x=1&y=2#section).\nhttp://example.org/path 와 www.example.com!';
  const result = render(text);
  assert.equal(result.text, text);
  assert.deepEqual(result.links.map(link => link.href), ['https://example.com/a_(b)?x=1&y=2#section', 'http://example.org/path', 'https://www.example.com/']);
  for (const link of result.links) {
    assert.equal(link.tag, 'a');
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
  }
});

test('submitted HTML, executable schemes and invalid URLs stay text', () => {
  const text = '<img src=x onerror=alert(1)> javascript:alert(1) data:text/html,test https:// https://[invalid';
  const result = render(text);
  assert.equal(result.text, text);
  assert.equal(result.links.length, 0);
});
