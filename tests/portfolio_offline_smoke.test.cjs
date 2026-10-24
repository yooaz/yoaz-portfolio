'use strict';

// Dependency-free contract checks. No Stripe client, network, or order data.
const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/create-checkout.js');
const { scoreOrderRisk } = require('../backend/fraud-score.js');

function read(response) {
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.match(response.headers['Content-Type'], /^application\/json/);
  return JSON.parse(response.body);
}

function withTestEnv(overrides, fn) {
  const original = new Map();
  for (const [key, value] of Object.entries(overrides)) {
    original.set(key, Object.hasOwn(process.env, key) ? process.env[key] : undefined);
    process.env[key] = value;
  }
  return Promise.resolve().then(fn).finally(() => {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('checkout rejects GET before reading any order data', async () => {
  const response = await handler({ httpMethod: 'GET', body: '{invalid' });
  assert.equal(response.statusCode, 405);
  assert.deepEqual(read(response), { error: 'Method not allowed' });
});

test('checkout rejects unknown product without provider calls', async () => {
  const response = await handler({ httpMethod: 'POST', body: JSON.stringify({ slug: 'not-a-product' }) });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(read(response), { error: 'Unknown product' });
});

test('checkout fails closed when no payment configuration is present', async () => {
  await withTestEnv({
    STRIPE_LINK_FACES: '',
    STRIPE_UNIVERSAL_PAYMENT_LINK: '',
    STRIPE_PAYMENT_LINK: '',
    STRIPE_SECRET_KEY: '',
  }, async () => {
    const response = await handler({ httpMethod: 'POST', body: '{"slug":"faces"}' });
    assert.equal(response.statusCode, 503);
    assert.deepEqual(read(response), { error: 'Stripe not configured' });
  });
});

test('checkout resolves a synthetic HTTPS payment link without a Stripe API call', async () => {
  await withTestEnv({ STRIPE_LINK_FACES: 'https://example.invalid/test-link' }, async () => {
    const response = await handler({ httpMethod: 'POST', body: '{"slug":"faces"}' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(read(response), {
      url: 'https://example.invalid/test-link',
      mode: 'payment_link',
    });
  });
});

test('risk scorer keeps an ordinary synthetic order at low risk', () => {
  const result = scoreOrderRisk({
    stripeRiskLevel: 'normal', cvcCheck: 'pass', postalCheck: 'pass',
    billingAddress: { country: 'FR' }, shippingAddress: { country: 'fr', line1: '10 Rue Test' },
    ipCountry: 'FR', customerEmail: 'customer@example.invalid', amountTotal: 5900,
    previousFailedAttempts: 0,
  });
  assert.deepEqual(result, { score: 0, level: 'low', reasons: [], holdForManualReview: false });
});

test('risk scorer holds a synthetic high-risk order for manual review', () => {
  const result = scoreOrderRisk({
    stripeRiskLevel: 'highest', cvcCheck: 'fail', postalCheck: 'fail',
    billingAddress: { country: 'FR' }, shippingAddress: { country: 'NL', line1: '10 Example Road' },
    ipCountry: 'DE', customerEmail: 'customer@mailinator.com', amountTotal: 20000,
    previousFailedAttempts: 2,
  });
  assert.equal(result.level, 'high');
  assert.equal(result.holdForManualReview, true);
  assert.ok(result.score >= 90);
  assert.ok(result.reasons.includes('Stripe risk highest'));
});
