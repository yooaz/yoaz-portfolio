'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { auditCatalog, run } = require('../tools/shop-catalog-audit.cjs');

const valid = () => ({
  id: 'solar_1', slug: 'solar-art', title: 'Solar Art', alt: 'Solar Art by Yoaz',
  active: true, featured: false, currency: 'EUR', priceFrom: 19.83,
  sizes: ['40x50 cm'], image: 'https://cdn.shopify.com/s/files/1/example.webp?v=1',
  shopifyProductUrl: 'https://yoaz-art.myshopify.com/products/solar-art',
  printFileUrl: '',
});
const codes = rows => auditCatalog(rows).failures.join(' ');
test('clean catalog passes without network', () => assert.deepEqual(auditCatalog([valid()]), { ok: true, count: 1, failures: [] }));
test('non-array and empty catalogs fail closed', () => {
  assert.match(codes({}), /CATALOG_NOT_NONEMPTY_ARRAY/);
  assert.match(codes([]), /CATALOG_NOT_NONEMPTY_ARRAY/);
});
test('duplicates across IDs and slugs fail', () => {
  assert.match(codes([valid(), valid()]), /DUPLICATE_ID/);
  assert.match(codes([valid(), valid()]), /DUPLICATE_SLUG/);
});
test('rejects empty titles and image alt text', () => {
  assert.match(codes([{ ...valid(), title: '   ', alt: '' }]), /MISSING_TITLE.*MISSING_IMAGE_ALT/);
});
test('rejects missing, fractional-cent and nonfinite prices', () => {
  for (const p of [0, -5, 1.001, 1e10, NaN, Infinity, '19.83'])
    assert.match(codes([{ ...valid(), priceFrom: p }]), /INVALID_EUR_PRICE/);
});
test('inactive featured cards and nonboolean statuses fail', () => {
  assert.match(codes([{ ...valid(), featured: true, active: false }]), /INVALID_VISIBILITY/);
  assert.match(codes([{ ...valid(), active: 'true' }]), /INVALID_VISIBILITY/);
});
test('rejects missing and repeated available sizes', () => {
  assert.match(codes([{ ...valid(), sizes: [] }]), /INVALID_SIZES/);
  assert.match(codes([{ ...valid(), sizes: ['A', 'A'] }]), /INVALID_SIZES/);
});
test('rejects insecure or lookalike image origins', () => {
  for (const image of ['http://cdn.shopify.com/s/files/a.webp', 'https://cdn.shopify.com.evil.test/s/files/a.webp',
    'https://user:pw@cdn.shopify.com/s/files/a.webp', 'javascript:alert(1)',
    'https://cdn.shopify.com/s/files/a.webp?access_token=abc'])
    assert.match(codes([{ ...valid(), image }]), /UNTRUSTED_IMAGE_URL/);
});
test('rejects spoofed Shopify links and mismatched products', () => {
  for (const shopifyProductUrl of ['https://yoaz-art.myshopify.com.evil.test/products/solar-art',
    'https://yoaz-art.myshopify.com/products/other-art',
    'https://yoaz-art.myshopify.com/products/solar-art?token=secret'])
    assert.match(codes([{ ...valid(), shopifyProductUrl }]), /UNTRUSTED_PRODUCT_URL/);
});
test('public print-resolution source file must never appear', () => {
  assert.match(codes([{ ...valid(), printFileUrl: 'https://cdn.example.test/full-print.tiff' }]), /PUBLIC_PRINT_SOURCE/);
});
test('malformed JSON fails closed without revealing contents', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-audit-'));
  const file = path.join(dir, 'posters.json');
  const log = console.error;
  const messages = [];
  try {
    fs.writeFileSync(file, '{ secret: "example" }');
    console.error = value => messages.push(value);
    assert.equal(run(file), 1);
    assert.match(messages[0], /HOLD_SHOP_CATALOG/);
    assert.doesNotMatch(messages[0], /example/);
  } finally {
    console.error = log;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
