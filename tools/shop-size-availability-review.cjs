'use strict';

// REVIEW ONLY. Detect contradictory claims in the checked-in catalogue.
// This does NOT establish that a variant is available or unavailable at Shopify.
const {readBoundedCatalogFile,parseStrictCatalogJson} = require('./catalog-file-io.cjs');
const path = require('node:path');
const MAX_POSTERS = 500;
const MAX_VARIANTS = 100;

function dimensionCm(value) {
  if (typeof value !== 'string' || value.length > 120) return null;
  // Only parse an explicit initial metric size; ignore trailing inch equivalents.
  const match = /^\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*[x×]\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*cm(?=$|[\s/;,()])/i.exec(value);
  if (!match) return null;
  const numbers = match.slice(1).map(v => Number(v.replace(',', '.')));
  if (numbers.some(v => !Number.isFinite(v) || v <= 0 || v > 1000)) return null;
  return numbers.map(v => String(v)).join('x');
}

function reviewPosterSizes(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: 'HOLD_INVALID_CATALOG', audited: 0,
      findings: [{ id: null, code: 'INVALID_CATALOG' }] };
  }
  if (rows.length > MAX_POSTERS) {
    return { status: 'HOLD_INVALID_CATALOG', audited: 0,
      findings: [{ id: null, code: 'CATALOG_TOO_LARGE' }] };
  }
  const findings = [];
  let audited = 0;
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      findings.push({ id: null, index, code: 'INVALID_PRODUCT' });
      continue;
    }
    // Only claim variant consistency on publicly active products.
    if (typeof row.active !== 'boolean') {
      findings.push({ id: null, index, code: 'INVALID_VISIBILITY' });
      continue;
    }
    if (row.active !== true) continue;
    audited++;
    // Report row indices only; never echo untrusted product IDs or possible tokens.
    const id = null;
    const add = code => findings.push({ id, index, code });
    const defaultDimension = dimensionCm(row.defaultSize);
    if (!defaultDimension) add('DEFAULT_SIZE_UNRECOGNIZED');
    if (Array.isArray(row.sizes) && row.sizes.length > MAX_VARIANTS) {
      add('TOO_MANY_VARIANTS');
      continue;
    }
    if (!Array.isArray(row.sizes) || row.sizes.length === 0 ||
      row.sizes.some(v => typeof v !== 'string' || !v.trim())) {
      add('NO_DECLARED_SIZES');
      continue;
    }
    const parsed = row.sizes.map(dimensionCm);
    const dimensionCount = parsed.filter(Boolean).length;
    if (dimensionCount === 0) {
      // Product/paper/finish labels may be legitimate Shopify options. Do not infer sizes.
      add('VERIFY_SHOPIFY_VARIANTS');
    } else {
      if (dimensionCount !== parsed.length) add('MIXED_SIZE_SEMANTICS');
      if (defaultDimension && !parsed.includes(defaultDimension)) add('DEFAULT_NOT_IN_DECLARED_SIZES');
    }
  }
  if (audited === 0) findings.push({ id: null, code: 'NO_ACTIVE_PRODUCTS' });
  return { status: findings.length ? 'HOLD_REVIEW_REQUIRED' : 'CONSISTENT_LOCAL_CLAIMS',
    audited, findings };
}


function run(file = path.resolve(__dirname, '../shop/posters.json'), output = console) {
  let report;
  try {
    const loaded = readBoundedCatalogFile(file);
    if (!loaded.ok) {
      report = {status:'HOLD_INVALID_CATALOG', audited:0,
        findings:[{id:null,code:loaded.code}]};
    } else {
      const parsed = parseStrictCatalogJson(loaded.text);
      if (!parsed.ok) {
        report = {status:'HOLD_INVALID_CATALOG',audited:0,
          findings:[{id:null,code:parsed.code}]};
      } else {
        report = reviewPosterSizes(parsed.value);
      }
    }
  } catch {
    // Never print file contents or paths, even when invalid/private.
    report = {status:'HOLD_INVALID_CATALOG', audited:0,
      findings:[{id:null,code:'CATALOG_UNREADABLE'}]};
  }
  output.log(JSON.stringify(report, null, 2));
  return report.status === 'CONSISTENT_LOCAL_CLAIMS' ? 0 : 2;
}

if (require.main === module) process.exitCode = run(process.argv[2]);
module.exports = {dimensionCm, reviewPosterSizes, run};
