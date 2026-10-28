'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {run:runAudit} = require('../tools/shop-catalog-audit.cjs');
const {run:runSize} = require('../tools/shop-size-availability-review.cjs');
const {parseStrictCatalogJson} = require('../tools/catalog-file-io.cjs');
const sample = {id:'synthetic',handle:'synthetic',slug:'synthetic',title:'Demo',displayTitle:'Demo',category:'print',active:true,featured:false,priceFrom:19.83,currency:'EUR',defaultSize:'50x70 cm',sizes:['50x70 cm'],image:'https://cdn.shopify.com/s/files/1/demo.webp?v=1',alt:'Demo image',description:'Demo',shopifyProductUrl:'https://yoaz-art.myshopify.com/products/synthetic',stripePriceId:'',gelatoProductUid:'',printFileUrl:'',provider:'manual',riskNotes:[]};
const fixture=JSON.stringify(sample);
function report(raw, type) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-json-gate-'));
 const file=path.join(dir,'posters.json'); const records=[];
 try {
   fs.writeFileSync(file,raw);
   if (type==='size') return {code:runSize(file,{log:x=>records.push(x)}),logs:records.join(' ')};
   const oldLog=console.log,oldErr=console.error;
   console.log=x=>records.push(String(x));console.error=x=>records.push(String(x));
   try {return {code:runAudit(file),logs:records.join(' ')}} finally {console.log=oldLog;console.error=oldErr;}
 } finally {fs.rmSync(dir,{recursive:true,force:true})}
}
const duplicate=(keyA,keyB,valA,valB) => '['+fixture.slice(0,-1)+',"'+keyA+'":'+JSON.stringify(valA)+',"'+keyB+'":'+JSON.stringify(valB)+'}]';

test('general audit refuses duplicate printFileUrl with hidden first sensitive URL',()=>{
 const raw=duplicate('printFileUrl','printFileUrl','https://private.invalid/SECRET_PRINT_SOURCE','');
 const out=report(raw,'audit');assert.equal(out.code,1);assert.match(out.logs,/HOLD_SHOP_CATALOG/);assert.doesNotMatch(out.logs,/SECRET_PRINT_SOURCE/);
});
test('general audit refuses escaped duplicate key with hidden value',()=>{
 const raw=duplicate('printFileUrl','printFile\\u0055rl','https://private.invalid/SECRET_PRINT_SOURCE','');
 const out=report(raw,'audit');assert.equal(out.code,1);assert.doesNotMatch(out.logs,/SECRET_PRINT_SOURCE/);
});
test('size audit refuses duplicate active and defaultSize that hide contradictory states',()=>{
 const raw=duplicate('defaultSize','defaultSize','300x700 cm','50x70 cm');
 const out=report(raw,'size');assert.equal(out.code,2);assert.match(out.logs,/HOLD_INVALID_CATALOG/);
});
test('both audits reject valid JSON with duplicate nested metadata keys',()=>{
 const raw='['+fixture.slice(0,-1)+',"internal":{"token":"PRIVATE_NOT_REAL","token":""}}]';
 for(const type of ['audit','size']) { const out=report(raw,type);assert.equal(out.code,type==='audit'?1:2);assert.doesNotMatch(out.logs,/PRIVATE_NOT_REAL|internal/); }
});
test('valid escaped Unicode keys are accepted as distinct names when unambiguous',()=>{
 const raw='[{"a\\u0062":1,"ac":2}]';
 const parsed=parseStrictCatalogJson(raw);
 assert.equal(parsed.ok,true);assert.deepEqual(parsed.value,[{ab:1,ac:2}]);
});
test('invalid duplicate of escaped Unicode keys is rejected by strict parser',()=>{
 const parsed=parseStrictCatalogJson('[{"a\\u0062":1,"ab":2}]');
 assert.equal(parsed.ok,false);assert.equal(parsed.code,'DUPLICATE_JSON_KEY');
});
test('ordinary valid catalogue remains accepted by both offline tools',()=>{
 const raw='['+fixture+']';assert.equal(report(raw,'audit').code,0);assert.equal(report(raw,'size').code,0);
});
