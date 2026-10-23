'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scoreOrderRisk } = require('../backend/fraud-score.js');

const reason = 'Possible PO box / forwarding address';
const risk = (line1) => scoreOrderRisk({ shippingAddress: { line1 } });

for (const line1 of ['PO Box 42', 'P.O. Box 42', 'P O Box 42', 'P.O.Box 42', 'POBOX 42', 'Post Office Box 42', 'Parcel Locker 19', 'parcel point 12', 'forwarder depot', 'reship warehouse']) {
  test(`flags forwarding address: ${line1}`, () => {
    const result = risk(line1);
    assert.equal(result.score, 20);
    assert.ok(result.reasons.includes(reason));
  });
}
for (const line1 of ['42 Main Street', '1 Parcelled Road', '8 Superlocker Avenue', '5 Forwardershire Lane', '17 boxwood drive']) {
  test(`does not flag unrelated address: ${line1}`, () => {
    const result = risk(line1);
    assert.equal(result.score, 0);
    assert.ok(!result.reasons.includes(reason));
  });
}
test('risk classification and manual review thresholds remain unchanged', () => {
  const result = scoreOrderRisk({ shippingAddress: { line1: 'P.O. Box 12', country: 'NL' }, billingAddress: { country: 'FR' }, stripeRiskLevel: 'elevated' });
  assert.equal(result.score, 95);
  assert.equal(result.level, 'high');
  assert.equal(result.holdForManualReview, true);
});
