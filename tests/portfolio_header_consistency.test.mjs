import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const headers = readFileSync(new URL('../_headers', import.meta.url), 'utf8');
const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const globalBlock = headers.split(/\r?\n\r?\n/, 1)[0];
const globalToml = toml.match(/\[\[headers\]\]\s*\n\s*for\s*=\s*"\/\*"\s*\n\s*\[headers\.values\]([\s\S]*?)(?=\n\[\[headers\]\]|\n\[\[redirects\]\]|$)/)?.[1] ?? '';
const headerValue = (source, key) => source.match(new RegExp('^\\s*' + key + '\\s*:\\s*(.+)$', 'mi'))?.[1]?.trim();
const tomlValue = (source, key) => source.match(new RegExp('^\\s*' + key + '\\s*=\\s*"([^"]+)"', 'mi'))?.[1];

test('legacy _headers is a single global header block', () => {
  assert.match(globalBlock, /^\/\*\s*$/m);
  assert.equal((headers.match(/^\s*X-DNS-Prefetch-Control\s*:/gmi) ?? []).length, 1);
});
test('Netlify TOML and legacy _headers both disable speculative DNS prefetch', () => {
  assert.equal(headerValue(globalBlock, 'X-DNS-Prefetch-Control'), 'off');
  assert.equal(tomlValue(globalToml, 'X-DNS-Prefetch-Control'), 'off');
});
test('legacy _headers must not contain a conflicting on directive', () => {
  assert.doesNotMatch(headers, /^\s*X-DNS-Prefetch-Control\s*:\s*on\s*$/mi);
});
test('HSTS, clickjacking and MIME safeguards remain unchanged across both sources', () => {
  for(const key of ['Strict-Transport-Security', 'X-Frame-Options', 'X-Content-Type-Options']){
    assert.equal(headerValue(globalBlock,key),tomlValue(globalToml,key), key);
  }
});
test('do not change Shopify permissions or CSP allowed payment destinations in legacy headers', () => {
  assert.match(globalBlock, /payment=\(self "https:\/\/yoaz-art\.myshopify\.com"\)/);
  assert.match(globalBlock, /form-action 'self' https:\/\/formspree\.io https:\/\/yoaz-art\.myshopify\.com/);
});
test('SEO text and image cache controls remain present in legacy _headers', () => {
  assert.match(headers, /\/images\/\*\s*\n\s*Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/sitemap\.xml\s*\n\s*Cache-Control: public, max-age=3600/);
});
test('HTML is revalidated, not held immutable', () => {
  assert.match(headers, /\/\*\.html\s*\n\s*Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(toml, /for = "\/\*\.html"\s*\n\s*\[headers\.values\]\s*\n\s*Cache-Control = "public, max-age=0, must-revalidate"/);
});
