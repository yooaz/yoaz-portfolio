'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const source = fs.readFileSync(process.env.PORTFOLIO_SUCCESS_HTML || path.join(__dirname, '..', 'order-success.html'), 'utf8');

test('public return page cannot claim Stripe payment was verified', () => {
  assert.doesNotMatch(source, /commande confirmée côté Stripe|paiement reçu|commande confirmée\s*[—-]/i);
});
test('title accurately identifies an unverified payment return', () => {
  assert.match(source, /<title>Retour de paiement — Yoaz<\/title>/);
});
test('page clearly states that opening it does not confirm an order', () => {
  assert.match(source, /ne vérifie pas le paiement/i);
  assert.match(source, /ne constitue pas une confirmation de commande/i);
});
test('manual payment verification is required before printing', () => {
  assert.match(source, /uniquement après vérification manuelle du paiement/i);
});
test('no query-string based or client-side payment approval is introduced', () => {
  assert.doesNotMatch(source, /<script\b|URLSearchParams|location\.search|session_id=|fetch\s*\(/i);
});
test('approved visual CSS and return link remain unchanged', () => {
  const style = source.match(/<style>(.*?)<\/style>/s)?.[1];
  assert.equal(createHash('sha256').update(style || '').digest('hex'), '93e40ebb054115cfa00bd6a47e1e6d7897a425a3df35f8b5062d6ffd8bc0a60f');
  assert.match(source, /<a href="\/">Retour au site<\/a>/);
});
