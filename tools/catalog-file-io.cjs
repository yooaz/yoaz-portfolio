'use strict';
// Single strict, read-only source loader used by both public poster audits.
// The result never contains the source path or original bytes on error.
const fs = require('node:fs');
const MAX_INPUT_BYTES = 1048576;

function readBoundedCatalogFile(file) {
  // An offline audit must not follow a link or block on a FIFO/device.
  if (typeof file !== 'string' || !file || file.includes('\0') ||
      !Number.isInteger(fs.constants.O_NOFOLLOW)) return {ok:false, code:'CATALOG_UNREADABLE'};
  let fd;
  try {
    fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | fs.constants.O_NOFOLLOW);
    const before = fs.fstatSync(fd);
    if (!before.isFile() || !Number.isSafeInteger(before.size) || before.size < 0) return {ok:false, code:'CATALOG_UNREADABLE'};
    if (before.size > MAX_INPUT_BYTES) return {ok:false, code:'CATALOG_FILE_TOO_LARGE'};
    const bytes = Buffer.alloc(before.size + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = fs.readSync(fd, bytes, count, bytes.length - count, count);
      if (read === 0) break;
      count += read;
    }
    const after = fs.fstatSync(fd);
    if (count !== before.size || after.size !== before.size ||
        before.dev !== after.dev || before.ino !== after.ino ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      return {ok:false, code:'CATALOG_UNREADABLE'};
    return {ok:true, text:new TextDecoder('utf-8', {fatal:true}).decode(bytes.subarray(0,count))};
  } catch {
    return {ok:false, code:'CATALOG_UNREADABLE'};
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

module.exports = {readBoundedCatalogFile};
