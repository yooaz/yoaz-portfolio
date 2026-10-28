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


// JSON.parse silently takes the last occurrence of an object key. That is
// unsafe for an audit of public source JSON: an ignored earlier value remains
// present in the bytes published to visitors. Validate tokens and all key
// occurrences (including JSON-escaped equivalents) before JSON.parse.
function parseStrictCatalogJson(source) {
  if (typeof source !== 'string' || Buffer.byteLength(source, 'utf8') > MAX_INPUT_BYTES)
    return {ok:false,code:'CATALOG_UNREADABLE'};
  const MAX_DEPTH = 32;
  const MAX_NODES = 40000;
  let position = 0, nodes = 0;
  const reject = code => { throw {code}; };
  const whitespace = () => {
    while (position < source.length && /[\t\r\n ]/.test(source[position])) position++;
  };
  const readString = () => {
    if (source[position] !== '"') reject('CATALOG_INVALID_JSON');
    const start = position++;
    while (position < source.length) {
      const ch = source[position++];
      if (ch === '"') {
        try { return JSON.parse(source.slice(start,position)); }
        catch { reject('CATALOG_INVALID_JSON'); }
      }
      if (ch === '\\') {
        const escaped = source[position++];
        if (escaped === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(source.slice(position,position+4)))
            reject('CATALOG_INVALID_JSON');
          position += 4;
        } else if (!'"\\/bfnrt'.includes(escaped || '')) reject('CATALOG_INVALID_JSON');
      } else if (ch.charCodeAt(0) < 0x20) reject('CATALOG_INVALID_JSON');
    }
    reject('CATALOG_INVALID_JSON');
  };
  const readValue = depth => {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) reject('CATALOG_COMPLEXITY_LIMIT');
    whitespace();
    const ch = source[position];
    if (ch === '{') {
      position++; whitespace();
      const seen = new Set();
      if (source[position] === '}') { position++; return; }
      while (true) {
        whitespace();
        const key = readString();
        if (seen.has(key)) reject('DUPLICATE_JSON_KEY');
        seen.add(key);
        whitespace();
        if (source[position++] !== ':') reject('CATALOG_INVALID_JSON');
        readValue(depth+1);
        whitespace();
        const sep = source[position++];
        if (sep === '}') return;
        if (sep !== ',') reject('CATALOG_INVALID_JSON');
      }
    }
    if (ch === '[') {
      position++; whitespace();
      if (source[position] === ']') { position++; return; }
      while (true) {
        readValue(depth+1);
        whitespace();
        const sep = source[position++];
        if (sep === ']') return;
        if (sep !== ',') reject('CATALOG_INVALID_JSON');
      }
    }
    if (ch === '"') { readString(); return; }
    for (const literal of ['true','false','null']) {
      if (source.startsWith(literal,position)) { position+=literal.length; return; }
    }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(position));
    if (number) { position+=number[0].length; return; }
    reject('CATALOG_INVALID_JSON');
  };
  try {
    whitespace(); readValue(0); whitespace();
    if (position !== source.length) reject('CATALOG_INVALID_JSON');
    return {ok:true,value:JSON.parse(source)};
  } catch(error) {
    return {ok:false,code:typeof error?.code==='string'?error.code:'CATALOG_INVALID_JSON'};
  }
}

module.exports = {readBoundedCatalogFile,parseStrictCatalogJson};
