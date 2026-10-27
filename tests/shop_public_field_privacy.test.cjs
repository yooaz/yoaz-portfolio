'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {auditCatalog} = require('../tools/shop-catalog-audit.cjs');
function valid() {
 return {id:'synthetic',handle:'synthetic',slug:'synthetic',title:'Demo',displayTitle:'Demo',category:'Wall Art Print',
 active:true,featured:false,priceFrom:19.83,currency:'EUR',defaultSize:'50x70 cm',sizes:['50x70 cm'],
 image:'https://cdn.shopify.com/s/files/1/synthetic.webp?v=1',alt:'Demo image',description:'Art poster demo',
 shopifyProductUrl:'https://yoaz-art.myshopify.com/products/synthetic',stripePriceId:'',gelatoProductUid:'',
 printFileUrl:'',provider:'manual_then_gelato',riskNotes:[]};
}
const findings = item=>auditCatalog([item]).failures.join(' ');
test('approved public fields are accepted without network',()=>{
 assert.deepEqual(auditCatalog([valid()]),{ok:true,count:1,failures:[]});
});
test('unknown credential field cannot silently enter public JSON',()=>{
 const result=findings({...valid(),apiToken:'SYNTHETIC_SECRET_NOT_REAL'});
 assert.match(result,/UNEXPECTED_PUBLIC_FIELD/);
 assert.doesNotMatch(result,/SYNTHETIC_SECRET_NOT_REAL|apiToken/);
});
test('inherited and untrusted extra keys are rejected from parsed JSON',()=>{
 const row=JSON.parse(JSON.stringify(valid()).replace(/}\s*$/,' ,"privateBackup":"SYNTHETIC_ONLY"}'));
 assert.match(findings(row),/UNEXPECTED_PUBLIC_FIELD/);
});
test('nonempty risk notes require manual review rather than public publishing',()=>{
 assert.match(findings({...valid(),riskNotes:['INTERNAL_NOTE']}),/PUBLIC_INTERNAL_NOTES/);
});
test('nonnumeric risk notes are not blindly accepted',()=>{
 for (const riskNotes of ['token',null,{}])
  assert.match(findings({...valid(),riskNotes}),/PUBLIC_INTERNAL_NOTES/);
});
test('nonempty provider identifiers remain private until explicit review',()=>{
 assert.match(findings({...valid(),gelatoProductUid:'SYNTHETIC_PROVIDER_ID'}),/PUBLIC_PROVIDER_IDENTIFIER/);
 assert.match(findings({...valid(),stripePriceId:'SYNTHETIC_PRICE_ID'}),/PUBLIC_PROVIDER_IDENTIFIER/);
});
test('privacy findings never contain source values or field names',()=>{
 const report=auditCatalog([{...valid(),apiToken:'DUMMY_PRIVATE_VALUE',riskNotes:['DUMMY_NOTE'],gelatoProductUid:'DUMMY_PROVIDER'}]);
 assert.equal(report.ok,false);
 assert.doesNotMatch(JSON.stringify(report),/DUMMY_PRIVATE_VALUE|DUMMY_NOTE|DUMMY_PROVIDER|apiToken/);
});
