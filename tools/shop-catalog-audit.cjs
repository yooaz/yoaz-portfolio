'use strict';

// Offline, read-only release preflight for the public poster catalogue.
// No checkout, provider API calls, file writes or deployment.
const {readBoundedCatalogFile} = require('./catalog-file-io.cjs');
const path = require('node:path');

function safeUrl(value, host, prefix) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    // Only Shopify's public numeric CDN cache version is accepted.
    // Unknown or percent-encoded query names can carry secrets into public JSON.
    // Inspect raw delimiters too: WHATWG URL erases trailing '?' and '#'.
    const queryAt = value.indexOf('?');
    const rawQuery = queryAt < 0 ? null : value.slice(queryAt);
    const safeQuery = host === 'cdn.shopify.com'
      ? (rawQuery === null || /^\?v=[0-9]{1,13}$/.test(rawQuery))
      : rawQuery === null;
    return url.protocol === 'https:' && url.hostname === host &&
      value.trim() === value && !value.includes('#') &&
      !url.username && !url.password && !url.port && !url.hash &&
      url.pathname.startsWith(prefix) && safeQuery;
  } catch { return false; }
}

// Published shop/posters.json is a public file. Unexpected fields can expose
// internal API identifiers or unpublished source metadata even if unused by UI.
const PUBLIC_POSTER_FIELDS = new Set([
  'id','handle','title','displayTitle','slug','category','active','featured',
  'priceFrom','currency','defaultSize','sizes','image','alt','description',
  'shopifyProductUrl','stripePriceId','gelatoProductUid','printFileUrl',
  'provider','riskNotes',
]);

function auditCatalog(rows) {
  const failures = [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, count: 0, failures: ['CATALOG_NOT_NONEMPTY_ARRAY'] };
  }
  const ids = new Set();
  const slugs = new Set();
  rows.forEach((row, index) => {
    const mark = code => failures.push('row ' + (index + 1) + ': ' + code);
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      mark('INVALID_PRODUCT'); return;
    }
    // Fail closed on unknown keys without printing the key or its value.
    if (Object.keys(row).some(key => !PUBLIC_POSTER_FIELDS.has(key))) mark('UNEXPECTED_PUBLIC_FIELD');
    // These metadata keys are not payment/fulfilment API authorization. Do not
    // silently publish provider references or internal review notes in static JSON.
    if (row.riskNotes !== undefined &&
        (!Array.isArray(row.riskNotes) || row.riskNotes.length !== 0)) mark('PUBLIC_INTERNAL_NOTES');
    if (![undefined, null, ''].includes(row.gelatoProductUid) ||
        ![undefined, null, ''].includes(row.stripePriceId)) mark('PUBLIC_PROVIDER_IDENTIFIER');
    if (typeof row.id !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(row.id)) mark('INVALID_ID');
    else if (ids.has(row.id)) mark('DUPLICATE_ID');
    else ids.add(row.id);

    if (typeof row.slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(row.slug)) mark('INVALID_SLUG');
    else if (slugs.has(row.slug)) mark('DUPLICATE_SLUG');
    else slugs.add(row.slug);

    if (typeof row.title !== 'string' || !row.title.trim()) mark('MISSING_TITLE');
    if (typeof row.alt !== 'string' || !row.alt.trim()) mark('MISSING_IMAGE_ALT');
    if (typeof row.active !== 'boolean' || typeof row.featured !== 'boolean' || (row.featured && !row.active)) mark('INVALID_VISIBILITY');
    if (row.currency !== 'EUR' || typeof row.priceFrom !== 'number' || !Number.isFinite(row.priceFrom) ||
        row.priceFrom <= 0 || row.priceFrom > 100000 ||
        Math.abs(row.priceFrom * 100 - Math.round(row.priceFrom * 100)) > 1e-7) mark('INVALID_EUR_PRICE');
    if (!Array.isArray(row.sizes) || row.sizes.length === 0 ||
        row.sizes.some(v => typeof v !== 'string' || !v.trim() || v.length > 120) ||
        new Set(row.sizes).size !== row.sizes.length) mark('INVALID_SIZES');

    if (!safeUrl(row.image, 'cdn.shopify.com', '/s/files/')) mark('UNTRUSTED_IMAGE_URL');
    if (!safeUrl(row.shopifyProductUrl, 'yoaz-art.myshopify.com', '/products/') ||
        (typeof row.slug === 'string' &&
         row.shopifyProductUrl !== 'https://yoaz-art.myshopify.com/products/' + row.slug)) mark('UNTRUSTED_PRODUCT_URL');

    // Never publish source-resolution print files in this public JSON.
    if (row.printFileUrl !== '' && row.printFileUrl !== null && row.printFileUrl !== undefined) mark('PUBLIC_PRINT_SOURCE');
  });
  return { ok: failures.length === 0, count: rows.length, failures };
}

function run(file = path.resolve(__dirname, '../shop/posters.json')) {
  try {
    const loaded = readBoundedCatalogFile(file);
    if (!loaded.ok) throw new Error('UNTRUSTED_CATALOG_FILE');
    const result = auditCatalog(JSON.parse(loaded.text));
    if (!result.ok) {
      console.error('HOLD_SHOP_CATALOG: ' + result.failures.join('; '));
      return 1;
    }
    console.log('PASS_SHOP_CATALOG: ' + result.count + ' entries checked offline');
    return 0;
  } catch {
    console.error('HOLD_SHOP_CATALOG: missing or malformed JSON');
    return 1;
  }
}

if (require.main === module) process.exitCode = run(process.argv[2]);
module.exports = { auditCatalog, run };
