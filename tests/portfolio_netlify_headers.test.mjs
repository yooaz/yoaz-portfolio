import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const headers = netlify.match(/\[\[headers\]\]\s*\n\s*for\s*=\s*"\/\*"\s*\n\s*\[headers\.values\]([\s\S]*?)(?=\n\[\[headers\]\]|\n\[\[redirects\]\]|$)/);
const global = headers?.[1] ?? '';

test('Netlify has exactly one global header block', () => {
  assert.ok(headers, 'Missing global headers');
  assert.equal((netlify.match(/for\s*=\s*"\/\*"/g) ?? []).length, 1);
});
test('Speculative DNS prefetch is disabled, not enabled', () => {
  assert.match(global, /^\s*X-DNS-Prefetch-Control\s*=\s*"off"\s*$/m);
  assert.equal((netlify.match(/X-DNS-Prefetch-Control\s*=/g) ?? []).length, 1);
  assert.doesNotMatch(global, /X-DNS-Prefetch-Control\s*=\s*"on"/);
});
test('Existing clickjacking and MIME defenses remain present', () => {
  assert.match(global, /^\s*X-Frame-Options\s*=\s*"SAMEORIGIN"/m);
  assert.match(global, /^\s*X-Content-Type-Options\s*=\s*"nosniff"/m);
});
test('CSP and HSTS remain configured', () => {
  assert.match(global, /^\s*Content-Security-Policy\s*=\s*"default-src/m);
  assert.match(global, /^\s*Strict-Transport-Security\s*=\s*"max-age=/m);
});
test('Canonical redirect and 404 fallback remain present', () => {
  assert.match(netlify, /from\s*=\s*"https:\/\/www\.yoaz\.fr\/\*"/);
  assert.match(netlify, /to\s*=\s*"https:\/\/yoaz\.fr\/:splat"/);
  assert.match(netlify, /to\s*=\s*"\/404\.html"/);
});
