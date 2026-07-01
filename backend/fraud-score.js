// Lightweight risk scoring for Yoaz poster orders.
// Use server-side only inside a Netlify/Vercel function after Stripe webhook.

function normalizeCountry(value) {
  return String(value || '').trim().toUpperCase();
}

function isDisposableEmail(email) {
  const domain = String(email || '').split('@').pop()?.toLowerCase();
  const disposable = new Set(['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com']);
  return disposable.has(domain);
}

function scoreOrderRisk(order) {
  let score = 0;
  const reasons = [];

  const stripeRisk = order.stripeRiskLevel;
  if (stripeRisk === 'highest') { score += 90; reasons.push('Stripe risk highest'); }
  if (stripeRisk === 'elevated') { score += 45; reasons.push('Stripe risk elevated'); }

  if (order.cvcCheck && order.cvcCheck !== 'pass') { score += 35; reasons.push('CVC check failed or unavailable'); }
  if (order.postalCheck && order.postalCheck !== 'pass') { score += 25; reasons.push('Postal/ZIP check failed or unavailable'); }

  const billingCountry = normalizeCountry(order.billingAddress?.country);
  const shippingCountry = normalizeCountry(order.shippingAddress?.country);
  const ipCountry = normalizeCountry(order.ipCountry);

  if (billingCountry && shippingCountry && billingCountry !== shippingCountry) {
    score += 30; reasons.push('Billing country differs from shipping country');
  }
  if (ipCountry && shippingCountry && ipCountry !== shippingCountry) {
    score += 25; reasons.push('IP country differs from shipping country');
  }

  if (isDisposableEmail(order.customerEmail)) { score += 30; reasons.push('Disposable email domain'); }
  if ((order.amountTotal || 0) > 18000) { score += 20; reasons.push('High order value for poster shop'); }
  if ((order.previousFailedAttempts || 0) >= 2) { score += 30; reasons.push('Multiple failed payment attempts'); }

  const line1 = String(order.shippingAddress?.line1 || '').toLowerCase();
  if (/p\.?1?o\.?1? box|parcel|locker|forwarder|reship/.test(line1)) {
    score += 20; reasons.push('Possible PO box / forwarding address');
  }

  const level = score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { score, level, reasons, holdForManualReview: level !== 'low' };
}

module.exports = { scoreOrderRisk };
