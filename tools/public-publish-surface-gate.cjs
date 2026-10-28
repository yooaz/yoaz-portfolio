'use strict';
// Offline read-only release preflight. No network, build, deploy, or file writes.
// HOLD means manual inspection is required; this does not prove public exposure.
const fs = require('node:fs');
const path = require('node:path');
const MAX_CONFIG_BYTES = 64 * 1024;
const MAX_ENTRIES = 20000;
const MAX_DEPTH = 24;
const IGNORE_INFRA_DIRS = new Set(['.git', 'node_modules', '.netlify']);

function strictPublishDir(config) {
  if (typeof config !== 'string' || Buffer.byteLength(config, 'utf8') > MAX_CONFIG_BYTES) return null;
  let section = '';
  const published = [];
  for (const rawLine of config.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^\[[\w.]+\]$/.test(line)) { section = line.slice(1, -1); continue; }
    if (section !== 'build' || !/^publish\s*=/.test(line)) continue;
    const m = /^publish\s*=\s*(["'])([^"']*)\1\s*(?:#.*)?$/.exec(line);
    if (!m) return null;
    published.push(m[2]);
  }
  if (published.length !== 1) return null;
  const p = published[0].replaceAll('\\', '/');
  if (p === '.' || p === './') return '.';
  if (!p || path.posix.isAbsolute(p) || /^(?:\.\.\/|\.\.($|\/))/.test(p) || p.split('/').some(s => !s || s === '.' || s === '..')) return null;
  return p;
}

function categoryFor(name) {
  const lower = name.toLowerCase();
  if (/^\.env(?:\..*)?$/.test(lower) || /^(?:id_rsa|id_ed25519)(?:\.pub)?$/.test(lower) ||
      /\.(?:pem|p12|pfx|key|sqlite|sqlite3|db)$/.test(lower)) return 'SECRET_OR_DATABASE_FILE';
  if (/\.(?:bak|backup|orig|old|swp|swo)$/.test(lower) || /~$/.test(lower) ||
      /\.v\d+backup(?:\..*)?$/.test(lower)) return 'BACKUP_FILE';
  if (/\.(?:csv|tsv|webloc)$/.test(lower)) return 'EXPORT_OR_LOCAL_REFERENCE';
  if (/\.(?:zip|7z|tar|tgz|gz)$/.test(lower)) return 'ARCHIVE_FILE';
  return null;
}

function inspectPublishSurface(root) {
  const findings = [];
  let inspected = 0;
  const hold = (code, rel = null) => findings.push({code, ...(rel === null ? {} : {path: rel})});
  if (typeof root !== 'string' || root.length === 0 || root.includes('\0')) {
    hold('INVALID_ROOT'); return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  const absolute = path.resolve(root);
  let config;
  try {
    const cfg = path.join(absolute, 'netlify.toml');
    const stat = fs.lstatSync(cfg);
    if (!stat.isFile() || stat.size > MAX_CONFIG_BYTES) throw Error('CONFIG_INVALID');
    config = fs.readFileSync(cfg, 'utf8');
  } catch {
    hold('MISSING_OR_UNREADABLE_NETLIFY_CONFIG');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  const relPublish = strictPublishDir(config);
  if (relPublish === null) {
    hold('INVALID_OR_AMBIGUOUS_PUBLISH_DIRECTORY');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  const publishRoot = path.resolve(absolute, relPublish);
  if (publishRoot !== absolute && !publishRoot.startsWith(absolute + path.sep)) {
    hold('PUBLISH_OUTSIDE_ROOT');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  function scan(dir, rel, depth) {
    if (depth > MAX_DEPTH || inspected >= MAX_ENTRIES) { hold('SCAN_LIMIT_REACHED'); return; }
    let entries;
    try { entries = fs.readdirSync(dir, {withFileTypes:true}); }
    catch { hold('UNREADABLE_PUBLISH_DIRECTORY', rel); return; }
    entries.sort((a,b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (++inspected > MAX_ENTRIES) { hold('SCAN_LIMIT_REACHED'); return; }
      if (e.name === '.' || e.name === '..') continue;
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isSymbolicLink()) { hold('SYMLINK_UNSAFE_TO_ASSUME', r); continue; }
      if (e.isDirectory()) {
        if (!IGNORE_INFRA_DIRS.has(e.name)) scan(path.join(dir, e.name), r, depth+1);
      } else if (e.isFile()) {
        const code = categoryFor(e.name);
        if (code) hold(code, r);
      } else hold('NONREGULAR_PUBLISH_ENTRY', r);
    }
  }
  try { if (!fs.lstatSync(publishRoot).isDirectory()) throw Error('NOT_DIR'); }
  catch { hold('MISSING_PUBLISH_DIRECTORY'); return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false}; }
  scan(publishRoot, '', 0);
  return {status: findings.length ? 'HOLD' : 'REVIEW_ONLY', publish:relPublish,
    inspected, findings, networkUsed:false, wroteFiles:false};
}

if (require.main === module) {
  const result = process.argv.length === 3 ? inspectPublishSurface(process.argv[2]) :
    {status:'HOLD', findings:[{code:'EXPECTED_ONE_ROOT_ARGUMENT'}], networkUsed:false, wroteFiles:false};
  process.stdout.write(JSON.stringify(result) + '\n');
  // Always review-only, never a deploy authorization, even for a clean tree.
  process.exitCode = result.status === 'HOLD' ? 2 : 0;
}
module.exports = {strictPublishDir, categoryFor, inspectPublishSurface};
