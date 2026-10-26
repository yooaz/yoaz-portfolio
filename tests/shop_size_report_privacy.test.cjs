'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {reviewPosterSizes} = require('../tools/shop-size-availability-review.cjs');

test('malformed active visibility is held instead of ignored', () => {
  const r = reviewPosterSizes([{id:'wrong',active:'true',defaultSize:'50×70 cm',sizes:['50x70 cm']}]);
  assert.ok(r.findings.some(f=>f.code === 'INVALID_VISIBILITY'));
});
test('no active posters cannot be presented as verified', () => {
  const r = reviewPosterSizes([{id:'inactive',active:false,defaultSize:'50×70 cm',sizes:['50x70 cm']}]);
  assert.equal(r.status,'HOLD_REVIEW_REQUIRED');
  assert.ok(r.findings.some(f=>f.code === 'NO_ACTIVE_PRODUCTS'));
});
test('untrusted product identifiers are not echoed in public reports', () => {
  const r = reviewPosterSizes([{id:'sk_live_faketoken',active:true,defaultSize:'50×70 cm',sizes:['40x50 cm']}]);
  assert.ok(r.findings.length);
  assert.equal(r.findings[0].id,null);
  assert.doesNotMatch(JSON.stringify(r), /sk_live_faketoken/);
});
test('live checked-in catalog may need human review without falsely claiming Shopify status', () => {
  const fs=require('node:fs');
  const path=require('node:path');
  const rows=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../shop/posters.json'),'utf8'));
  const r=reviewPosterSizes(rows);
  assert.equal(r.audited,rows.filter(row=>row&&row.active===true).length);
  assert.ok(['HOLD_REVIEW_REQUIRED','CONSISTENT_LOCAL_CLAIMS'].includes(r.status));
  assert.ok(r.findings.every(f=>typeof f.code==='string'));
});
