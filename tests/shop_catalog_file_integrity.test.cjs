'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {run} = require('../tools/shop-catalog-audit.cjs');

const fixture = JSON.stringify([{
  id:'synthetic',slug:'synthetic',title:'SYNTHETIC PHOTO',alt:'Synthetic photo',
  active:true,featured:false,currency:'EUR',priceFrom:19.83,sizes:['40x50 cm'],
  image:'https://cdn.shopify.com/s/files/1/synthetic.webp?v=1',
  shopifyProductUrl:'https://yoaz-art.myshopify.com/products/synthetic',
  printFileUrl:'',
}]);
function withTemp(fn) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'yoaz-catalog-qa-'));
  try {return fn(dir)} finally {fs.rmSync(dir,{recursive:true,force:true});}
}
function check(file) {
  const output=[],originalLog=console.log,originalErr=console.error;
  try {
    console.log=value=>output.push(['log',String(value)]);
    console.error=value=>output.push(['error',String(value)]);
    const exit=run(file);
    return {exit,output};
  } finally {console.log=originalLog;console.error=originalErr;}
}
test('accept a small regular synthetic catalog',()=>withTemp(dir=>{
  const file=path.join(dir,'regular.json');fs.writeFileSync(file,fixture);
  const result=check(file);assert.equal(result.exit,0);assert.match(result.output[0][1],/^PASS_SHOP_CATALOG:/);
}));
test('reject symlink pointing to otherwise valid catalog',()=>withTemp(dir=>{
  const original=path.join(dir,'real.json'),link=path.join(dir,'link.json');
  fs.writeFileSync(original,fixture);fs.symlinkSync(original,link);
  const result=check(link);assert.equal(result.exit,1);assert.match(result.output[0][1],/HOLD_SHOP_CATALOG/);
}));
test('reject invalid UTF-8 even when JSON replacement would pass audit',()=>withTemp(dir=>{
  const file=path.join(dir,'invalid-utf8.json'),data=Buffer.from(fixture);
  const offset=data.indexOf(Buffer.from('SYNTHETIC PHOTO'));
  assert.ok(offset >= 0);data[offset] = 0xff;fs.writeFileSync(file,data);
  const result=check(file);assert.equal(result.exit,1);assert.match(result.output[0][1],/HOLD_SHOP_CATALOG/);
  assert.doesNotMatch(JSON.stringify(result.output),/SYNTHETIC PHOTO/);
}));
test('reject oversized regular JSON without parsing',()=>withTemp(dir=>{
  const file=path.join(dir,'oversized.json');fs.writeFileSync(file,Buffer.alloc(1048577,32));
  const result=check(file);assert.equal(result.exit,1);assert.match(result.output[0][1],/HOLD_SHOP_CATALOG/);
}));
test('reject directories as catalog evidence',()=>withTemp(dir=>{
  const result=check(dir);assert.equal(result.exit,1);assert.match(result.output[0][1],/HOLD_SHOP_CATALOG/);
}));
