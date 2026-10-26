'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {reviewPosterSizes,run}=require('../tools/shop-size-availability-review.cjs');
const row={id:'demo',active:true,defaultSize:'50x70 cm',sizes:['50x70 cm']};
test('catalogue with 501 items is not approved by a bounded offline gate',()=>{
  const result=reviewPosterSizes(Array.from({length:501},()=>({...row})));
  assert.equal(result.status,'HOLD_INVALID_CATALOG');
  assert.deepEqual(result.findings.map(x=>x.code),['CATALOG_TOO_LARGE']);
});
test('poster with 101 variants is held to keep inspection bounded',()=>{
  const result=reviewPosterSizes([{...row,sizes:Array.from({length:101},(_,i)=>`${20+i}x30 cm`)}]);
  assert.equal(result.status,'HOLD_REVIEW_REQUIRED');
  assert.ok(result.findings.some(x=>x.code==='TOO_MANY_VARIANTS'));
});
test('oversized local catalogue file fails closed without exposing source',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bounded-catalog-'));
  try {
    const filename=path.join(dir,'oversized.json');
    fs.writeFileSync(filename,' '.repeat(1048577));
    let report='';
    assert.equal(run(filename,{log(s){report=s;}}),2);
    assert.match(report,/CATALOG_FILE_TOO_LARGE/);
    assert.doesNotMatch(report,/oversized\.json/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
