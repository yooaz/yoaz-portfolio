'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../netlify/functions/create-checkout.js'),
  'utf8',
);

function makeHandler(env = {}, fakeRequire = () => {
  throw new Error('Stripe must never be loaded by offline tests');
}) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    process: { env },
    require: fakeRequire,
  }, { timeout: 1000 });
  return module.exports.handler;
}

const request = (slug) => ({ httpMethod: 'POST', body: JSON.stringify({ slug }) });
const parsed = (result) => JSON.parse(result.body);

test('known poster can resolve configured link without calling Stripe', async () => {
  const handler = makeHandler({
    STRIPE_UNIVERSAL_PAYMENT_LINK: 'https://buy.stripe.com/test_dummy',
  });
  const response = await handler(request('faces'));
  assert.equal(response.statusCode, 200);
  assert.equal(parsed(response).mode, 'payment_link');
});

test('prototype-inherited names cannot bypass product allowlist', async () => {
  const handler = makeHandler({
    STRIPE_UNIVERSAL_PAYMENT_LINK: 'https://buy.stripe.com/test_dummy',
  });
  for (const slug of ['toString', '__proto__', 'constructor']) {
    const response = await handler(request(slug));
    assert.equal(response.statusCode, 400, slug);
    assert.equal(parsed(response).error, 'Unknown product');
  }
});

test('non-string and missing product identifiers fail closed', async () => {
  const handler = makeHandler({
    STRIPE_UNIVERSAL_PAYMENT_LINK: 'https://buy.stripe.com/test_dummy',
  });
  for (const slug of [null, 12, {}, [], undefined]) {
    const response = await handler(request(slug));
    assert.equal(response.statusCode, 400);
  }
});

test('malformed JSON is a client error without parser details', async () => {
  const handler = makeHandler();
  const response = await handler({ httpMethod: 'POST', body: '{' });
  assert.equal(response.statusCode, 400);
  assert.equal(parsed(response).error, 'Invalid JSON body');
});

test('wrong HTTP method and missing payment configuration remain blocked', async () => {
  const handler = makeHandler();
  assert.equal((await handler({ httpMethod: 'GET' })).statusCode, 405);
  assert.equal((await handler(request('faces'))).statusCode, 503);
});

test('provider exception is redacted; no live Stripe call occurs', async () => {
  const handler = makeHandler(
    { STRIPE_SECRET_KEY: 'dummy-secret' },
    () => { throw new Error('provider echoed dummy-secret'); },
  );
  const response = await handler(request('faces'));
  assert.equal(response.statusCode, 500);
  assert.equal(parsed(response).error, 'Checkout temporarily unavailable');
  assert.ok(!response.body.includes('dummy-secret'));
});
