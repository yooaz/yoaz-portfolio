'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {inspectPublishSurface, categoryFor} = require('../tools/public-publish-surface-gate.cjs');
function fixture(name, type='dir') {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'yoaz-static-surface-'));
  fs.writeFileSync(path.join(root,'netlify.toml'),'[build]\npublish = "."\n');
  fs.writeFileSync(path.join(root,'index.html'),'synthetic');
  if (type==='dir') {fs.mkdirSync(path.join(root,name));fs.writeFileSync(path.join(root,name,'fixture.txt'),'synthetic');}
  else fs.writeFileSync(path.join(root,name),'synthetic');
  return root;
}
function useFixture(name,type,fn){const root=fixture(name,type);try{fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}}
for(const name of ['.GIT','.GITHUB','.NETLIFY','TESTS','TOOLS','NODE_MODULES','ＴＥＳＴＳ','ＴＯＯＬＳ','．ＧＩＴ','node＿modules']) {
 test(`directory ${name} must HOLD regardless of case and compatible Unicode`,()=>useFixture(name,'dir',root=>{
   const result=inspectPublishSurface(root);
   assert.equal(result.status,'HOLD');
   assert.deepEqual(result.findings,[{code:'DEVELOPMENT_DIRECTORY_IN_PUBLISH_TREE',path:name}]);
   assert.equal(result.networkUsed,false); assert.equal(result.wroteFiles,false);
 }));
}
for(const [name,expected] of [
 ['．ＥＮＶ','SECRET_OR_DATABASE_FILE'],['private.ＰＥＭ','SECRET_OR_DATABASE_FILE'],
 ['private.ＢＡＫ','BACKUP_FILE'],['private.ＺＩＰ','ARCHIVE_FILE'],
 ['private.ＣＳＶ','EXPORT_OR_LOCAL_REFERENCE'],['.ＮＰＭＲＣ','SECRET_OR_DATABASE_FILE'],
]){
 test(`sensitive filename ${name} must HOLD`,()=>useFixture(name,'file',root=>{
   const result=inspectPublishSurface(root);
   assert.equal(result.status,'HOLD');
   assert.deepEqual(result.findings,[{code:expected,path:name}]);
 }));
}
for(const [name,type] of [['images','dir'],['TOOLBOX','dir'],['accounting','dir'],['design.CSV-safe','file'],['folio.zip.webp','file']]){
 test(`legitimate ${name} remains REVIEW_ONLY`,()=>useFixture(name,type,root=>{
   const result=inspectPublishSurface(root);
   assert.equal(result.status,'REVIEW_ONLY');
   assert.deepEqual(result.findings,[]);
 }));
}
test('sensitive classification is exact and no broad filename leakage',()=>{
 assert.equal(categoryFor('list.ＰＥＭ'),'SECRET_OR_DATABASE_FILE');
 assert.equal(categoryFor('banner.zip.webp'),null);
});
