'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const code = fs.readFileSync(path.join(__dirname, '../scripts/instagram-safe-tiles.js'), 'utf8');
const valid = { ok: true, items: [{ media_url: 'https://scontent.cdninstagram.com/a.jpg',
  permalink: 'https://www.instagram.com/p/ABC123/' }] };

function setup(fetchImpl, { noAbort = false, clock = () => 1000 } = {}) {
  const window = {};
  const timers = new Map();
  let nextId = 0;
  let aborts = 0;
  let clears = 0;
  class FakeAbortController {
    constructor() { this.signal = { aborted: false }; }
    abort() { this.signal.aborted = true; aborts += 1; }
  }
  vm.runInNewContext(code, {
    window, fetch: fetchImpl, URL, Date: { now: clock },
    AbortController: noAbort ? null : FakeAbortController,
    setTimeout(fn, ms) {
      assert.equal(ms, 8000, 'strict eight-second network deadline');
      const id = ++nextId;
      timers.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
      clears += 1;
    },
  }, { timeout: 1000 });
  return {
    get: window.yoazFetchInstagramFeed,
    fire() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'a timeout must be scheduled');
      timers.delete(entry[0]);
      entry[1]();
    },
    pending: () => timers.size,
    aborts: () => aborts,
    clears: () => clears,
  };
}

test('stalled HTTP request: concurrent callers share timeout, abort and explicit retry', async () => {
  let calls = 0;
  const api = setup(async () => { calls += 1; return new Promise(() => {}); });
  const first = api.get();
  const second = api.get();
  assert.equal(calls, 1);
  api.fire();
  const results = await Promise.allSettled([first, second]);
  for (const result of results) {
    assert.equal(result.status, 'rejected');
    assert.match(String(result.reason), /HOLD_INSTAGRAM_TIMEOUT/);
  }
  assert.equal(api.aborts(), 1);
  assert.equal(api.pending(), 0);
  const retry = api.get();
  assert.equal(calls, 2, 'failure is never cached');
  api.fire();
  await assert.rejects(retry, /HOLD_INSTAGRAM_TIMEOUT/);
  assert.equal(api.aborts(), 2);
});

test('hanging response.json times out; a later successful request is not poisoned', async () => {
  let calls = 0;
  const api = setup(async () => {
    calls += 1;
    return calls === 1 ? { ok: true, json: async () => new Promise(() => {}) } :
      { ok: true, json: async () => valid };
  });
  const stalled = api.get();
  api.fire();
  await assert.rejects(stalled, /HOLD_INSTAGRAM_TIMEOUT/);
  assert.equal((await api.get()).items.length, 1);
  assert.equal(calls, 2);
  assert.equal(api.pending(), 0);
});

test('missing AbortController still fails closed after the same deadline', async () => {
  const api = setup(async () => new Promise(() => {}), { noAbort: true });
  const stalled = api.get();
  api.fire();
  await assert.rejects(stalled, /HOLD_INSTAGRAM_TIMEOUT/);
  assert.equal(api.aborts(), 0);
  assert.equal(api.pending(), 0);
});

test('success clears deadline and preserves shared in-memory cache', async () => {
  let calls = 0;
  const api = setup(async () => { calls += 1; return { ok: true, json: async () => valid }; });
  const result = await Promise.all([api.get(), api.get(), api.get()]);
  assert.equal(calls, 1);
  assert.equal(result[0].items.length, 1);
  assert.equal(api.pending(), 0);
  assert.equal(api.clears(), 1);
  await api.get();
  assert.equal(calls, 1, 'cached successful response is reused');
});

test('failed HTTP request clears deadline and is not cached', async () => {
  let calls = 0;
  const api = setup(async () => {
    calls += 1;
    return calls === 1 ? { ok: false } : { ok: true, json: async () => valid };
  });
  await assert.rejects(api.get(), /HOLD_INSTAGRAM_HTTP/);
  assert.equal(api.pending(), 0);
  assert.equal((await api.get()).items.length, 1);
  assert.equal(calls, 2);
  assert.equal(api.clears(), 2);
});
