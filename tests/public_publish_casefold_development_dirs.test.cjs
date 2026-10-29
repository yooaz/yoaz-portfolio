'use strict';
// Regression-only: a case variant of a development directory must not be
// silently treated as an ordinary public asset. No network or deployment.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inspectPublishSurface } = require('../tools/public-publish-surface-gate.cjs');

function withFixture(directory, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yoaz-casefold-publish-'));
  try {
    fs.writeFileSync(path.join(root, 'netlify.toml'), '[build]\npublish = "."\n');
    fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>synthetic</title>');
    const folder = path.join(root, directory);
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, 'synthetic.txt'), 'not a real secret');
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

for (const directory of ['.GIT', '.GITHUB', '.NETLIFY', 'TESTS', 'TOOLS', 'NODE_MODULES']) {
  test('case-variant development directory requires HOLD: ' + directory, () => {
    withFixture(directory, root => {
      const result = inspectPublishSurface(root);
      assert.equal(result.networkUsed, false);
      assert.equal(result.wroteFiles, false);
      assert.equal(result.status, 'HOLD');
      assert.ok(result.findings.some(f =>
        f.code === 'DEVELOPMENT_DIRECTORY_IN_PUBLISH_TREE' && f.path === directory
      ), 'case-variant development directory must be flagged');
    });
  });
}

test('normal public directory remains review-only', () => {
  withFixture('images', root => {
    const result = inspectPublishSurface(root);
    assert.equal(result.status, 'REVIEW_ONLY');
    assert.deepEqual(result.findings, []);
  });
});
