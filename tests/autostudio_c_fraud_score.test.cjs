'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {scoreOrderRisk}=require('../backend/fraud-score.js');
for(const invalid of [undefined,null,'',0,1,'order',false,true,[],[{}]]) test('malformed payload requires manual review: '+String(invalid),()=>{
  const r=scoreOrderRisk(invalid);
  assert.equal(r.level,'high');assert.equal(r.holdForManualReview,true);assert.equal(r.score,100);
});
for(const address of ['P.O. Box 34','PO Box 34','P O Box 34','P O  Box 34','Post Office Box 34','Parcel Locker 123','parcel-locker 123','Locker 123','forwarder service','Forwarding Center','Reshipping agent','reshipper facility']) test('forwarding/box risk recognized: '+address,()=>{
  const r=scoreOrderRisk({shippingAddress:{line1:address}});
  assert.equal(r.score,20);assert.ok(r.reasons.includes('Possible PO box / forwarding address'));
});
for(const address of ['Avenue des Fleurs 25','Pointe Noire 12','Mailbox Lane 5','Amsterdam 1017', 'Boxton 44','']) test('ordinary address does not trigger PO box rule: '+address,()=>{
  const r=scoreOrderRisk({shippingAddress:{line1:address}});
  assert.equal(r.score,0);assert.equal(r.level,'low');
});
test('Stripe highest means high review',()=>{
  const r=scoreOrderRisk({stripeRiskLevel:'highest'});assert.equal(r.score,90);assert.equal(r.level,'high');assert.equal(r.holdForManualReview,true);
});
test('high-value plus billing/shipping discrepancy triggers medium review',()=>{
  const r=scoreOrderRisk({amountTotal:19000,billingAddress:{country:'NL'},shippingAddress:{country:'FR'}});
  assert.equal(r.score,50);assert.equal(r.level,'medium');assert.equal(r.holdForManualReview,true);
});
test('disposable email flagged',()=>{
  const r=scoreOrderRisk({customerEmail:'alias@mailinator.com'});assert.equal(r.score,30);assert.equal(r.holdForManualReview,false);
});
test('valid normal order remains low risk',()=>{
  const r=scoreOrderRisk({stripeRiskLevel:'normal',cvcCheck:'pass',postalCheck:'pass',customerEmail:'buyer@example.com',billingAddress:{country:'NL'},shippingAddress:{country:'NL',line1:'Herengracht 10'},amountTotal:5900,previousFailedAttempts:0});
  assert.equal(r.score,0);assert.equal(r.level,'low');assert.equal(r.holdForManualReview,false);
});
