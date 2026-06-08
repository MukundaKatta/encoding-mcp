import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { encode, decode } from '../src/server.js';

test('html: encodes named entities', () => {
  assert.equal(encode('<a href="x">&copy;</a>', 'html'), '&lt;a href=&quot;x&quot;&gt;&amp;copy;&lt;/a&gt;');
});

test('html: encodes non-ASCII as numeric', () => {
  assert.equal(encode('héllo', 'html'), 'h&#233;llo');
});

test('html: decodes named entities', () => {
  assert.equal(decode('&lt;b&gt;hi&lt;/b&gt;', 'html'), '<b>hi</b>');
});

test('html: decodes numeric (decimal + hex)', () => {
  assert.equal(decode('h&#233;llo', 'html'), 'héllo');
  assert.equal(decode('h&#xe9;llo', 'html'), 'héllo');
});

test('url: percent-encodes', () => {
  assert.equal(encode('a b/c?d=e', 'url'), 'a%20b%2Fc%3Fd%3De');
});

test('url: decodes percent-encoding', () => {
  assert.equal(decode('a%20b%2Fc', 'url'), 'a b/c');
});

test('unicode: escapes non-ASCII', () => {
  assert.equal(encode('héllo', 'unicode'), 'h\\u00e9llo');
});

test('unicode: decodes \\uXXXX', () => {
  assert.equal(decode('h\\u00e9llo', 'unicode'), 'héllo');
});

test('round trip preserves text (url)', () => {
  const s = 'foo bar/baz?key=value&x=1';
  assert.equal(decode(encode(s, 'url'), 'url'), s);
});

test('round trip preserves text (html)', () => {
  const s = '<b>hello & "world"</b>';
  assert.equal(decode(encode(s, 'html'), 'html'), s);
});

test('html: round trip preserves literal entity text', () => {
  // Regression: "&lt;" as literal text must survive encode→decode and not
  // collapse into "<" (the &amp; entity must be decoded last).
  const s = '&lt;b&gt; & &amp; tags';
  assert.equal(decode(encode(s, 'html'), 'html'), s);
});

test('html: decodes &amp; last (no over-unwrapping)', () => {
  assert.equal(decode('&amp;lt;', 'html'), '&lt;');
  assert.equal(decode('&amp;amp;', 'html'), '&amp;');
});

test('html: round trips non-BMP characters (emoji)', () => {
  const s = 'hi 😀!';
  assert.equal(encode(s, 'html'), 'hi &#128512;!');
  assert.equal(decode(encode(s, 'html'), 'html'), s);
});

test('unicode: round trips non-BMP characters (emoji)', () => {
  const s = '😀';
  assert.equal(decode(encode(s, 'unicode'), 'unicode'), s);
});
