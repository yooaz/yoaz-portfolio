'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { auditCatalog } = require('../tools/shop-catalog-audit.cjs');

const currentCatalogPath = path.resolve(__dirname, '../shop/posters.json');

function sourceCatalog() {
  // Read from the actual repo at test time, not a hand-maintained mock list.
  return JSON.parse(fs.readFileSync(currentCatalogPath, 'utf8'));
}

test('the checked-in poster catalogue satisfies the same offline release gate', () => {
  const rows = sourceCatalog();
  const result = auditCatalog(rows);
  assert.ok(result.ok, result.failures.join('; '));
  assert.equal(result.count, rows.length);
});

test('a compromised future print-source field prevents release', () => {
  const rows = sourceCatalog();
  assert.ok(rows.length > 0);
  const changed = rows.map((entry, i) => i === 0
    ? { ...entry, printFileUrl: 'https://cdn.example.test/private-original.tiff' }
    : entry);
  const outcome = auditCatalog(changed);
  assert.equal(outcome.ok, false);
  assert.match(outcome.failures.join('; '), /PUBLIC_PRINT_SOURCE/);
});

test('a future lookalike external Shopify product URL prevents release', () => {
  const rows = sourceCatalog();
  assert.ok(rows.length > 0);
  const changed = rows.map((entry, i) => i === 0
    ? { ...entry, shopifyProductUrl: 'https://yoaz-art.myshopify.com.evil.test/products/' + entry.slug }
    : entry);
  const outcome = auditCatalog(changed);
  assert.equal(outcome.ok, false);
  assert.match(outcome.failures.join('; '), /UNTRUSTED_PRODUCT_URL/);
});
