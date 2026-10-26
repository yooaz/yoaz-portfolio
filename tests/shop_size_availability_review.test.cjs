'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {dimensionCm, reviewPosterSizes, run} = require('../tools/shop-size-availability-review.cjs');
const poster = (id, defaultSize, sizes, active=true) => ({id, defaultSize, sizes, active});

test('metric size parsing treats x and multiplication sign identically', () => {
  assert.equal(dimensionCm('50×70 cm'), '50x70');
  assert.equal(dimensionCm(' 50 x 70 cm / 20x28″'), '50x70');
  assert.equal(dimensionCm('20,5x30,5 cm'), '20.5x30.5');
});
test('rejects ambiguous or non-metric labels without guessing', () => {
  for (const value of ['Premium Matte Paper', '50x70″', '50x70 centimeters', '50x700 cm', '', null, '0x70 cm', '1001x20 cm']) {
    const result = dimensionCm(value);
    if (value === '50x700 cm') assert.equal(result, '50x700');
    else assert.equal(result, null);
  }
});
test('default is present, regardless of x glyph', () => {
  assert.deepEqual(reviewPosterSizes([poster('ok','50×70 cm',['40x50 cm / 16x20″','50x70 cm / 20x28″'])]),
    {status:'CONSISTENT_LOCAL_CLAIMS', audited:1, findings:[]});
});
test('comparison is exact and does not allow 50x700 to stand for 50x70', () => {
  const r = reviewPosterSizes([poster('bad','50×70 cm',['50x700 cm'])]);
  assert.deepEqual(r.findings.map(f=>f.code), ['DEFAULT_NOT_IN_DECLARED_SIZES']);
});
test('finish-only variant lists require Shopify confirmation, not a made-up size', () => {
  const r = reviewPosterSizes([poster('blue','50×70 cm',['Fine Art Poster','Wooden Frame'])]);
  assert.deepEqual(r.findings.map(f=>f.code), ['VERIFY_SHOPIFY_VARIANTS']);
});
test('mixed dimensions and paper labels require human review', () => {
  const r = reviewPosterSizes([poster('mixed','40x50 cm',['40×50 cm','Paper Type'])]);
  assert.deepEqual(r.findings.map(f=>f.code), ['MIXED_SIZE_SEMANTICS']);
});
test('invalid or missing defaults and sizes are not reported as good', () => {
  const r = reviewPosterSizes([poster('missing','poster',[])]);
  assert.deepEqual(r.findings.map(f=>f.code), ['DEFAULT_SIZE_UNRECOGNIZED','NO_DECLARED_SIZES']);
});
test('inactive products are not asserted to be available', () => {
  assert.equal(reviewPosterSizes([poster('hidden','50×70 cm',['40x50 cm'],false)]).audited,0);
});
test('untrusted rows are refused, not silently dropped', () => {
  const r = reviewPosterSizes([null, poster('valid','50x70 cm',['50x70 cm'])]);
  assert.deepEqual(r.findings.map(f=>f.code),['INVALID_PRODUCT']);
});
test('empty or non-array catalog fails closed', () => {
  for (const x of [[], {}, null]) assert.equal(reviewPosterSizes(x).status,'HOLD_INVALID_CATALOG');
});
test('input remains unchanged', () => {
  const row = Object.freeze(poster('immutable','50×70 cm',Object.freeze(['40x50 cm'])));
  reviewPosterSizes(Object.freeze([row]));
  assert.equal(row.defaultSize,'50×70 cm');
});
test('CLI does not write or emit raw source data; returns 2 for review-required', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'shop-size-contract-'));
  try {
    const file = path.join(dir,'poster.json');
    const source = JSON.stringify([poster('blocked','50×70 cm',['40x50 cm'])]);
    fs.writeFileSync(file,source);
    let logged='';
    assert.equal(run(file,{log(x){logged=x;}}),2);
    assert.equal(fs.readFileSync(file,'utf8'),source);
    assert.match(logged,/HOLD_REVIEW_REQUIRED/);
    assert.doesNotMatch(logged,/50×70 cm|40x50 cm/);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
test('CLI refuses malformed files without printing content', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'shop-size-contract-'));
  try {
    const file = path.join(dir,'poster.json');
    fs.writeFileSync(file,'{ "private_token":"verysecret" ');
    let logged='';
    assert.equal(run(file,{log(x){logged=x;}}),2);
    assert.match(logged,/HOLD_INVALID_CATALOG/);
    assert.doesNotMatch(logged,/verysecret/);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
