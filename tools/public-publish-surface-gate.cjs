'use strict';
// Offline read-only release preflight. No network, build, deploy, or file writes.
// HOLD means manual inspection is required; this does not prove public exposure.
const fs = require('node:fs');
const path = require('node:path');
const MAX_CONFIG_BYTES = 64 * 1024;
const MAX_ENTRIES = 20000;
const MAX_DEPTH = 24;
// These directories have legitimate uses in the repository, but a static
// publish root containing them requires a human packaging review. Never
// silently ignore their filenames in an otherwise REVIEW_ONLY result.
const MANUAL_REVIEW_DIRS = new Set(['.git', 'node_modules', '.netlify', '.github', 'tests', 'tools']);

function hasSymlinkedAncestor(absolute) {
  let current = path.parse(absolute).root;
  for (const component of path.relative(current, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    const entry = fs.lstatSync(current);
    if (!entry.isDirectory()) return true; // symlink or non-directory
  }
  return false;
}

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
  const lower = name.normalize('NFKC').toLowerCase();
  if (/^\.env(?:\..*)?$/.test(lower) || /^(?:\.npmrc|\.netrc|\.htpasswd|credentials\.json|service-account\.json)$/.test(lower) || /^(?:id_rsa|id_ed25519)(?:\.pub)?$/.test(lower) ||
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
  // Do not follow a symlink supplied as the checkout root: even a safe
  // publish="site" could otherwise inspect files outside the selected tree.
  try {
    if (hasSymlinkedAncestor(absolute) || !fs.lstatSync(absolute).isDirectory()) throw Error('NOT_A_REAL_DIRECTORY');
  } catch {
    hold('MISSING_OR_UNSAFE_ROOT');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  let config;
  let fd;
  try {
    const cfg = path.join(absolute, 'netlify.toml');
    // Open with O_NOFOLLOW and inspect the same descriptor throughout the read.
    // The old lstatSync -> readFileSync sequence could follow a symlink swapped
    // into place after the initial validation, reading an unrelated config.
    if (typeof fs.constants.O_NOFOLLOW !== 'number') throw Error('NO_NOFOLLOW');
    const stat = fs.lstatSync(cfg, {bigint:true});
    if (!stat.isFile() || stat.size > BigInt(MAX_CONFIG_BYTES)) throw Error('CONFIG_INVALID');
    fd = fs.openSync(cfg, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | fs.constants.O_NOFOLLOW);
    const opened = fs.fstatSync(fd, {bigint:true});
    if (!opened.isFile() || opened.dev!==stat.dev || opened.ino!==stat.ino ||
        opened.size!==stat.size || opened.mtimeNs!==stat.mtimeNs || opened.ctimeNs!==stat.ctimeNs)
      throw Error('CONFIG_SWAPPED');
    const buf = Buffer.alloc(MAX_CONFIG_BYTES+1);
    let count = 0;
    while (count < buf.length) {
      const n = fs.readSync(fd, buf, count, buf.length-count, count);
      if (n===0) break;
      count += n;
    }
    const after = fs.fstatSync(fd, {bigint:true});
    const named = fs.lstatSync(cfg, {bigint:true});
    if (count > MAX_CONFIG_BYTES || BigInt(count)!==stat.size ||
        after.dev!==opened.dev || after.ino!==opened.ino || after.size!==opened.size ||
        after.mtimeNs!==opened.mtimeNs || after.ctimeNs!==opened.ctimeNs ||
        !named.isFile() || named.dev!==after.dev || named.ino!==after.ino ||
        named.size!==after.size || named.mtimeNs!==after.mtimeNs || named.ctimeNs!==after.ctimeNs)
      throw Error('CONFIG_CHANGED_DURING_READ');
    config = new TextDecoder('utf-8', {fatal:true}).decode(buf.subarray(0,count));
  } catch {
    hold('MISSING_OR_UNREADABLE_NETLIFY_CONFIG');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  } finally {
    if (fd!==undefined) fs.closeSync(fd);
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
    // Verify the directory before AND after enumeration. Dirent objects alone
    // are stale after a rename: processing them could traverse outside root.
    let entries;
    try {
      const before = fs.lstatSync(dir, {bigint:true});
      if (!before.isDirectory()) { hold('PUBLISH_DIRECTORY_CHANGED_DURING_SCAN', rel); return; }
      entries = fs.readdirSync(dir, {withFileTypes:true});
      const after = fs.lstatSync(dir, {bigint:true});
      if (!after.isDirectory() || before.dev!==after.dev || before.ino!==after.ino ||
          before.mtimeNs!==after.mtimeNs || before.ctimeNs!==after.ctimeNs) {
        hold('PUBLISH_DIRECTORY_CHANGED_DURING_SCAN', rel); return;
      }
    } catch { hold('UNREADABLE_PUBLISH_DIRECTORY', rel); return; }
    entries.sort((a,b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (++inspected > MAX_ENTRIES) { hold('SCAN_LIMIT_REACHED'); return; }
      if (e.name === '.' || e.name === '..') continue;
      const r = rel ? rel + '/' + e.name : e.name;
      // Refuse entries swapped after enumeration, especially symlink swaps.
      // This does not provide a race-free FS snapshot; it fails closed when
      // an observable change occurs and avoids reading file contents.
      let current;
      try { current = fs.lstatSync(path.join(dir, e.name), {bigint:true}); }
      catch { hold('PUBLISH_ENTRY_CHANGED_DURING_SCAN', r); continue; }
      if (current.isSymbolicLink() || e.isSymbolicLink()) {
        hold('SYMLINK_UNSAFE_TO_ASSUME', r); continue;
      }
      if (e.isDirectory() && current.isDirectory()) {
        if (MANUAL_REVIEW_DIRS.has(e.name.normalize('NFKC').toLowerCase())) hold('DEVELOPMENT_DIRECTORY_IN_PUBLISH_TREE', r);
        else scan(path.join(dir, e.name), r, depth+1);
      } else if (e.isFile() && current.isFile()) {
        const code = categoryFor(e.name);
        if (code) hold(code, r);
      } else if (!e.isFile() && !e.isDirectory() && !current.isFile() && !current.isDirectory()) {
        hold('NONREGULAR_PUBLISH_ENTRY', r);
      } else hold('PUBLISH_ENTRY_CHANGED_DURING_SCAN', r);
    }
  }
  // A nested `publish="folder/site"` path must not cross a symlinked parent.
  // lstat on only the final directory would transparently follow that parent.
  try {
    let step = absolute;
    const parts = relPublish === '.' ? [] : relPublish.split('/');
    for (const part of parts) {
      step = path.join(step,part);
      if (!fs.lstatSync(step).isDirectory()) throw Error('UNSAFE_PUBLISH_COMPONENT');
    }
    if (!fs.lstatSync(publishRoot).isDirectory()) throw Error('NOT_DIR');
  } catch {
    hold('MISSING_OR_UNSAFE_PUBLISH_DIRECTORY');
    return {status:'HOLD', inspected, findings, networkUsed:false, wroteFiles:false};
  }
  // The scanner starts *inside* the publish root, so it cannot see the
  // name of that root (or any ancestor directory selected by publish=).
  // Never mark a selected source/infra directory as REVIEW_ONLY.
  const publishParts = relPublish === '.' ? [] : relPublish.split('/');
  for (let i = 0; i < publishParts.length; i++) {
    if (MANUAL_REVIEW_DIRS.has(publishParts[i].normalize('NFKC').toLowerCase())) {
      hold('DEVELOPMENT_DIRECTORY_AS_PUBLISH_ROOT', publishParts.slice(0, i + 1).join('/'));
      return {status:'HOLD', publish:relPublish, inspected, findings,
        networkUsed:false, wroteFiles:false};
    }
  }
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
