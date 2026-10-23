'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modulePath = require.resolve('../netlify/functions/instagram-feed.js');
const ENV_KEYS = [
  'INSTAGRAM_ACCESS_TOKEN', 'IG_GRAPH_ACCESS_TOKEN',
  'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_LIMIT',
];

async function withMockedFeed(env, mockFetch, callback) {
  const originalFetch = global.fetch;
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  try {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, env);
    global.fetch = mockFetch;
    delete require.cache[modulePath];
    const { handler } = require(modulePath);
    return await callback(handler);
  } finally {
    global.fetch = originalFetch;
    delete require.cache[modulePath];
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

const sample = (id) => ({
  id,
  media_type: 'IMAGE',
  media_url: 'https://cdn.example.test/picture.jpg',
  permalink: 'https://www.instagram.com/p/example/',
});
const success = (id) => ({ ok: true, json: async () => ({ data: [sample(id)] }) });
const neverFetch = async () => { throw new Error('Unexpected network call'); };

test('missing token fails without network and is not publicly cached', async () => {
  await withMockedFeed({}, neverFetch, async (handler) => {
    const result = await handler();
    assert.equal(result.statusCode, 503);
    assert.equal(result.headers['Cache-Control'], 'no-store');
  });
});

test('invalid INSTAGRAM_LIMIT falls back to nine', async () => {
  const seen = [];
  await withMockedFeed(
    { INSTAGRAM_ACCESS_TOKEN: 'dummy-token', INSTAGRAM_LIMIT: 'not-a-number' },
    async (url) => { seen.push(url); return success('a'); },
    async (handler) => {
      const result = await handler();
      assert.equal(result.statusCode, 200);
      assert.equal(new URL(seen[0]).searchParams.get('limit'), '9');
    },
  );
});

test('oversized INSTAGRAM_LIMIT clamps to 24', async () => {
  const seen = [];
  await withMockedFeed(
    { INSTAGRAM_ACCESS_TOKEN: 'dummy-token', INSTAGRAM_LIMIT: '999' },
    async (url) => { seen.push(url); return success('a'); },
    async (handler) => {
      await handler();
      assert.equal(new URL(seen[0]).searchParams.get('limit'), '24');
    },
  );
});

test('provider errors never leak provider message or credentials to visitors', async () => {
  await withMockedFeed(
    { INSTAGRAM_ACCESS_TOKEN: 'dummy-secret' },
    async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'invalid token dummy-secret' } }),
    }),
    async (handler) => {
      const result = await handler();
      assert.equal(result.statusCode, 502);
      assert.equal(result.headers['Cache-Control'], 'no-store');
      assert.equal(JSON.parse(result.body).error, 'Instagram feed temporarily unavailable');
      assert.ok(!result.body.includes('dummy-secret'));
    },
  );
});

test('warm cache is reused only for matching token, account and limit', async () => {
  const seen = [];
  await withMockedFeed(
    { INSTAGRAM_ACCESS_TOKEN: 'token-one', INSTAGRAM_LIMIT: '9' },
    async (url) => {
      const parsed = new URL(url);
      seen.push(parsed);
      return success(parsed.searchParams.get('access_token'));
    },
    async (handler) => {
      const first = await handler();
      const second = await handler();
      assert.equal(first.statusCode, 200);
      assert.equal(JSON.parse(second.body).cached, true);
      assert.equal(seen.length, 1);

      process.env.INSTAGRAM_ACCESS_TOKEN = 'token-two';
      const third = await handler();
      assert.equal(seen.length, 2);
      assert.equal(JSON.parse(third.body).items[0].id, 'token-two');

      process.env.INSTAGRAM_LIMIT = '12';
      await handler();
      assert.equal(seen.length, 3);

      process.env.INSTAGRAM_USER_ID = 'business-account';
      await handler();
      assert.equal(seen.length, 4);
    },
  );
});
