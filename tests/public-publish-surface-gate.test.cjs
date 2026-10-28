'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {inspectPublishSurface, strictPublishDir} = require('../tools/public-publish-surface-gate.cjs');
function fixture(callback, publish = '.') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yoaz-publish-'));
  fs.writeFileSync(path.join(root, 'netlify.toml'), `[build]\n publish = "${publish}"\n[functions]\n directory = "netlify/functions"\n`);
  try { return callback(root); }
  finally { fs.rmSync(root, {force:true, recursive:true}); }
}
const touch = (root, name) => { fs.mkdirSync(path.dirname(path.join(root,name)), {recursive:true}); fs.writeFileSync(path.join(root,name), 'synthetic'); };

test('read-only clean root reports REVIEW_ONLY, never deploy permission', () => fixture(root => {
  touch(root,'index.html'); touch(root,'images/hero.webp');
  const result = inspectPublishSurface(root);
  assert.equal(result.status, 'REVIEW_ONLY'); assert.equal(result.networkUsed, false);
  assert.equal(result.wroteFiles, false); assert.deepEqual(result.findings, []);
}));
test('historic index HTML backup under publish root causes HOLD', () => fixture(root => {
  touch(root,'index.html.v3backup');
  const r = inspectPublishSurface(root);
  assert.equal(r.status,'HOLD'); assert.deepEqual(r.findings,[{code:'BACKUP_FILE',path:'index.html.v3backup'}]);
}));
test('CSV/TSV exports and local web bookmarks require manual release review', () => fixture(root => {
  touch(root,'shop/product_audit.csv'); touch(root,'yoaz_final_google_optimized.csv.webloc');
  const r=inspectPublishSurface(root);
  assert.equal(r.status, 'HOLD');
  assert.deepEqual(r.findings.map(f=>f.code),['EXPORT_OR_LOCAL_REFERENCE','EXPORT_OR_LOCAL_REFERENCE']);
}));
test('keys and env files are HOLD without reading their contents', () => fixture(root => {
  touch(root,'.env'); touch(root,'certs/id_rsa'); touch(root,'certs/private.pem');
  assert.equal(inspectPublishSurface(root).findings.filter(f=>f.code==='SECRET_OR_DATABASE_FILE').length,3);
}));
test('published nested static directory is scoped precisely', () => fixture(root => {
  touch(root,'index.html.v3backup'); touch(root,'site/index.html');
  const r=inspectPublishSurface(root);
  // parent config must change to real nested directory
  fs.writeFileSync(path.join(root,'netlify.toml'), '[build]\npublish = "site"\n');
  const scoped=inspectPublishSurface(root);
  assert.equal(r.status,'HOLD'); assert.equal(scoped.status,'REVIEW_ONLY');
  assert.equal(scoped.publish,'site');
}));
test('duplicates or traversal publish paths HOLD', () => {
  for (const config of ['[build]\npublish = "."\npublish = "public"', '[build]\npublish = "../outside"', '[build]\npublish = "/tmp"', '[build]\npublish = "site//files"']) {
    assert.equal(strictPublishDir(config), null);
  }
});
test('no or unparseable config fails closed', () => fixture(root => {
  fs.writeFileSync(path.join(root,'netlify.toml'),'[build]\npublish=7\n');
  assert.equal(inspectPublishSurface(root).status,'HOLD');
  fs.unlinkSync(path.join(root,'netlify.toml'));
  assert.equal(inspectPublishSurface(root).status,'HOLD');
}));
test('symlinks are not followed', () => fixture(root => {
  touch(root,'index.html');fs.symlinkSync('index.html',path.join(root,'linked.html'));
  assert.deepEqual(inspectPublishSurface(root).findings,[{code:'SYMLINK_UNSAFE_TO_ASSUME',path:'linked.html'}]);
}));
test('nonregular FIFO is not read or followed (when supported)', (t) => fixture(root => {
  const {spawnSync} = require('node:child_process');
  const fifo=path.join(root,'events.fifo');
  const result=spawnSync('mkfifo',[fifo]);
  if (result.error || result.status) {t.skip('mkfifo not available');return;}
  assert.equal(inspectPublishSurface(root).findings[0].code,'NONREGULAR_PUBLISH_ENTRY');
}));
test('missing root and bad argument fail closed', () => {
  assert.equal(inspectPublishSurface('').status,'HOLD');
  assert.equal(inspectPublishSurface('/nonexistent/yoaz-public-root').status,'HOLD');
});

test('nested directory swap cannot inspect entries from outside publish root', () => fixture(root => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'yoaz-private-outside-'));
  const nested = path.join(root, 'assets');
  fs.mkdirSync(nested);
  touch(root, 'index.html');
  fs.writeFileSync(path.join(outside, '.env'), 'FICTIONAL_NEVER_REAL');
  const original = fs.readdirSync;
  let swapped = false;
  fs.readdirSync = function (...args) {
    if (args[0] === nested && !swapped) {
      swapped = true;
      fs.renameSync(nested, nested + '.previous');
      fs.symlinkSync(outside, nested, 'dir');
    }
    return original.apply(this, args);
  };
  try {
    const result = inspectPublishSurface(root);
    assert.equal(swapped, true);
    assert.equal(result.status, 'HOLD');
    assert.ok(result.findings.some(f => f.code === 'PUBLISH_DIRECTORY_CHANGED_DURING_SCAN'));
    assert.equal(JSON.stringify(result).includes('.env'), false,
      'private outside-root filenames must not enter audit output');
  } finally {
    fs.readdirSync = original;
    fs.rmSync(outside, {recursive:true, force:true});
  }
}));

test('file replaced by symbolic link after directory enumeration is HOLD', () => fixture(root => {
  const normal = path.join(root,'index.html');
  touch(root,'index.html');
  const original = fs.readdirSync;
  let swapped = false;
  fs.readdirSync = function (...args) {
    const entries = original.apply(this,args);
    if (args[0] === root && !swapped) {
      swapped = true;
      fs.renameSync(normal, normal + '.before');
      fs.symlinkSync(normal + '.before',normal);
    }
    return entries;
  };
  try {
    const result=inspectPublishSurface(root);
    assert.equal(swapped,true);
    assert.equal(result.status,'HOLD');
    assert.ok(result.findings.some(f => f.code === 'PUBLISH_DIRECTORY_CHANGED_DURING_SCAN' ||
      (f.code === 'SYMLINK_UNSAFE_TO_ASSUME' && f.path === 'index.html')));
  } finally { fs.readdirSync=original; }
}));

test('known local credential file names must be rejected without opening them', () => fixture(root => {
  const names = ['.npmrc','.netrc','.htpasswd','creds/credentials.json','creds/service-account.json'];
  names.forEach(name=>touch(root,name));
  const result=inspectPublishSurface(root);
  assert.equal(result.status,'HOLD');
  for (const name of names) {
    assert.ok(result.findings.some(f=>f.path===name && f.code==='SECRET_OR_DATABASE_FILE'),name);
  }
}));
