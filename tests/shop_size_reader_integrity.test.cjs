'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {run}=require('../tools/shop-size-availability-review.cjs');
const fixture=JSON.stringify([{id:'FAKE',active:true,defaultSize:'50x70 cm',sizes:['50x70 cm']}]);
function directory(fn) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-size-'));
 try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}
}
function check(file) {
 const logs=[];
 const code=run(file,{log:message=>logs.push(JSON.parse(message))});
 assert.equal(logs.length,1);
 return {code,report:logs[0]};
}
test('valid regular catalogue stays offline and reviewable',()=>directory(dir=>{
 const file=path.join(dir,'valid.json');fs.writeFileSync(file,fixture);
 const result=check(file);
 assert.equal(result.code,0);assert.equal(result.report.status,'CONSISTENT_LOCAL_CLAIMS');
}));
test('symbolic link to a valid catalogue must be held',()=>directory(dir=>{
 const real=path.join(dir,'real.json'),link=path.join(dir,'link.json');
 fs.writeFileSync(real,fixture);fs.symlinkSync(real,link);
 const result=check(link);
 assert.equal(result.code,2);assert.equal(result.report.status,'HOLD_INVALID_CATALOG');
}));
test('invalid UTF-8 inside otherwise valid JSON must be held',()=>directory(dir=>{
 const file=path.join(dir,'bad.json');
 const source=Buffer.from(fixture,'utf8');
 const marker=source.indexOf(Buffer.from('FAKE'));
 assert.ok(marker>=0);source[marker]=0xff;fs.writeFileSync(file,source);
 const result=check(file);
 assert.equal(result.code,2);assert.equal(result.report.status,'HOLD_INVALID_CATALOG');
 assert.equal(JSON.stringify(result.report).includes('FAKE'),false);
}));
test('directory input cannot be mistaken for catalogue',()=>directory(dir=>{
 const result=check(dir);
 assert.equal(result.code,2);assert.equal(result.report.status,'HOLD_INVALID_CATALOG');
}));
test('catalogue exceeding byte limit is refused',()=>directory(dir=>{
 const file=path.join(dir,'oversized.json');fs.writeFileSync(file,Buffer.alloc(1048577,32));
 const result=check(file);
 assert.equal(result.code,2);assert.deepEqual(result.report.findings,[{id:null,code:'CATALOG_FILE_TOO_LARGE'}]);
}));
