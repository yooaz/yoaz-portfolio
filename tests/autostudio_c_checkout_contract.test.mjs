import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../netlify/functions/create-checkout.js', import.meta.url), 'utf8');
function server(env = {}, { stripeError = null } = {}) {
  const calls = [];
  const sandbox = {
    exports: {},
    process: { env },
    Buffer,
    require(name) {
      assert.equal(name, 'stripe', 'unexpected dependency');
      return () => ({ checkout: { sessions: { async create(options) {
        calls.push(options);
        if (stripeError) throw stripeError;
        return { url: 'https://checkout.stripe.com/c/pay_test_only' };
      } } } });
    },
  };
  vm.runInNewContext(code, sandbox, { timeout: 1500, filename: 'create-checkout.js' });
  return { handler: sandbox.exports.handler, calls };
}
async function request(s, body, method = 'POST') {
  const result = await s.handler({ httpMethod: method, body });
  return { status: result.statusCode, body: JSON.parse(result.body), headers: result.headers };
}
const goodBody = JSON.stringify({ slug: 'chaos-horse' });

test('GET returns 405 without an API call', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  assert.equal((await request(s, goodBody, 'GET')).status, 405);
  assert.equal(s.calls.length, 0);
});
test('empty body returns a safe 400', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  assert.equal((await request(s, '')).status, 400);
  assert.equal(s.calls.length, 0);
});
test('malformed JSON returns 400, not a stack leak', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  const r = await request(s, '{bad json');
  assert.equal(r.status, 400);
  assert.equal(r.body.error, 'Invalid JSON');
  assert.equal(s.calls.length, 0);
});
test('oversized body returns 413 before JSON parsing', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  const r = await request(s, JSON.stringify({ slug: 'chaos-horse', extra: 'µ'.repeat(1500) }));
  assert.equal(r.status, 413);
  assert.equal(s.calls.length, 0);
});
test('non-string body is rejected', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  assert.equal((await request(s, { slug: 'chaos-horse' })).status, 400);
  assert.equal(s.calls.length, 0);
});
test('null/array/number do not select a product', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  for (const body of ['null', '["chaos-horse"]', '123']) assert.equal((await request(s, body)).status, 400);
  assert.equal(s.calls.length, 0);
});
test('prototype property names never match products', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  for (const slug of ['__proto__', 'constructor', 'toString']) {
    assert.equal((await request(s, JSON.stringify({ slug }))).status, 400);
  }
  assert.equal(s.calls.length, 0);
});
test('unknown slug fails closed', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  assert.equal((await request(s, JSON.stringify({ slug: 'faux-produit' }))).status, 400);
});
test('missing billing configuration returns 503', async () => {
  const s = server({});
  assert.equal((await request(s, goodBody)).status, 503);
  assert.equal(s.calls.length, 0);
});
test('configured payment link stays server-controlled', async () => {
  const s = server({ STRIPE_LINK_CHAOS_HORSE: 'https://buy.stripe.com/test-id' });
  const r = await request(s, JSON.stringify({ slug: 'chaos-horse', price: 1, url: 'https://evil.example' }));
  assert.equal(r.status, 200);
  assert.equal(r.body.url, 'https://buy.stripe.com/test-id');
  assert.equal(r.body.mode, 'payment_link');
  assert.equal(s.calls.length, 0);
});
test('specific link overrides generic fallback link', async () => {
  const s = server({ STRIPE_LINK_FACES: 'https://buy.stripe.com/faces', STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/all' });
  const r = await request(s, JSON.stringify({ slug: 'faces' }));
  assert.equal(r.body.url, 'https://buy.stripe.com/faces');
});
test('fake Stripe checkout preserves 59 EUR server-set amount', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' });
  const r = await request(s, JSON.stringify({ slug: 'chaos-horse', price: 0 }));
  assert.equal(r.status, 200);
  assert.equal(r.body.mode, 'checkout_session');
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].line_items[0].price_data.unit_amount, 5900);
  assert.equal(s.calls[0].line_items[0].price_data.currency, 'eur');
});
test('Stripe API error is not returned to the browser', async () => {
  const s = server({ STRIPE_SECRET_KEY: 'fake-secret' }, { stripeError: new Error('internal sk_test_PRIVATE_DATA') });
  const r = await request(s, goodBody);
  assert.equal(r.status, 500);
  assert.equal(r.body.error, 'Checkout temporarily unavailable');
  assert.ok(!JSON.stringify(r.body).includes('PRIVATE_DATA'));
});
test('JSON error and validation responses disable caching', async () => {
  const s = server({});
  const r = await request(s, '{');
  assert.equal(r.headers['Cache-Control'], 'no-store');
});
