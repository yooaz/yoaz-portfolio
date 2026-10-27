'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {readBoundedCatalogFile} = require('../tools/catalog-file-io.cjs');

function temporary(fn) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'yoaz-file-reader-'));
  try {return fn(dir);} finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('read bounded regular JSON exactly',()=>temporary(dir=>{
  const file=path.join(dir,'catalog.json');
  const source='[{"title":"café","id":"sample"}]';
  fs.writeFileSync(file,source);
  assert.deepEqual(readBoundedCatalogFile(file),{ok:true,text:source});
}));
test('reject symlink even when it points to valid JSON',()=>temporary(dir=>{
  const real=path.join(dir,'real'),link=path.join(dir,'alias');
  fs.writeFileSync(real,'[]');fs.symlinkSync(real,link);
  assert.deepEqual(readBoundedCatalogFile(link),{ok:false,code:'CATALOG_UNREADABLE'});
}));
test('reject malformed UTF-8 instead of silently replacing bytes',()=>temporary(dir=>{
  const file=path.join(dir,'broken.json');
  fs.writeFileSync(file,Buffer.from([91,34,0xff,34,93]));
  assert.deepEqual(readBoundedCatalogFile(file),{ok:false,code:'CATALOG_UNREADABLE'});
}));
test('reject oversized data with stable public error code',()=>temporary(dir=>{
  const file=path.join(dir,'large.json');fs.writeFileSync(file,Buffer.alloc(1048577,32));
  assert.deepEqual(readBoundedCatalogFile(file),{ok:false,code:'CATALOG_FILE_TOO_LARGE'});
}));
test('reject invalid filename without exposing it',()=>{
  for (const bad of [null,undefined,'',42,'secret\0source']) {
    assert.deepEqual(readBoundedCatalogFile(bad),{ok:false,code:'CATALOG_UNREADABLE'});
  }
});
test('never block or accept FIFO as evidence', {skip:process.platform==='win32'}, ()=>temporary(dir=>{
  const file=path.join(dir,'pipe');
  const result=spawnSync('mkfifo',[file],{timeout:2000});
  if (result.error) throw result.error;
  assert.equal(result.status,0);
  assert.deepEqual(readBoundedCatalogFile(file),{ok:false,code:'CATALOG_UNREADABLE'});
}));
