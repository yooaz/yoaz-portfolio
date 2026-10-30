'use strict';
// Synthetic fixtures only. No publishing, network or external data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {inspectPublishSurface} = require('../tools/public-publish-surface-gate.cjs');

function checkRoot(publish) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'yoaz-root-guard-'));
  try {
    fs.writeFileSync(path.join(root,'netlify.toml'), `[build]\npublish = "${publish}"\n`);
    fs.mkdirSync(path.join(root,publish), {recursive:true});
    fs.writeFileSync(path.join(root,publish,'index.html'), '<html><title>fictional static page</title></html>');
    return inspectPublishSurface(root);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
}
for (const publish of ['tests','tools','.git','node_modules','.github','.netlify',
  'site/TESTS','public/.GIT','site/ＴＯＯＬＳ', 'site/ＮＯＤＥ＿ＭＯＤＵＬＥＳ']) {
  test('a development directory used as publish root requires HOLD: '+publish, () => {
    const result=checkRoot(publish);
    assert.equal(result.networkUsed,false);
    assert.equal(result.wroteFiles,false);
    assert.equal(result.status,'HOLD');
    assert.ok(result.findings.some(f=>f.code==='DEVELOPMENT_DIRECTORY_AS_PUBLISH_ROOT'), JSON.stringify(result));
  });
}
for(const publish of ['public','site/assets','TESTS-public']) {
  test('non-development publish root remains only REVIEW_ONLY: '+publish,()=>{
    const result=checkRoot(publish);
    assert.equal(result.status,'REVIEW_ONLY');
    assert.equal(result.networkUsed,false);
    assert.equal(result.wroteFiles,false);
  });
}
