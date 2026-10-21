# AUTO-STUDIO C — Portfolio YoAz checkout/Instagram review handoff

Date: 2026-10-21. Branch: autostudio/c/yoaz-checkout-validation-ig-safe-20261021.
Original main SHA: 00aca0df357bd526a895cbb63252c4bcfea13461.

## Changes

- Netlify checkout: invalid JSON/slug, inherited prototype keys and non-POST fail closed.
- Prices and quantities are always fixed on the server, not taken from browser input.
- Raw Stripe error messages are no longer exposed to the client.
- Payment links are restricted to official buy.stripe.com and checkout.stripe.com
  HTTPS hosts with non-root paths; custom branded domains require separate review.
- Instagram media/permalink URLs require HTTPS; malformed limits default safely;
  provider error details are redacted, upstream calls time out after nine seconds.
- Cache refreshes when the token, account ID or item limit changes.
- Instagram API: professional account Graph v26.0 or Instagram Login v26.0;
  retired Basic Display fallback and expired v20.0 path removed.
- Fraud score: invalid order payloads require manual review; PO Box and
  forwarding-address risk pattern no longer contains a corrupted control byte.

## Local verification

101/101 offline Node test cases PASS across checkout, Instagram and risk scorer;
all three application file Git blob hashes matched exact GitHub branch content.
Mocks were used for both Stripe and Instagram and no live API calls were made.

## Remaining HOLD

- Browser/Netlify deploy previews/live checkout and current Instagram token NOT_RUN.
- No Stripe real payment/refund; no Meta live feed and no webhook validation.
- No claim of compliance with payment/security obligations or fraud prevention.
- Embedded direct STRIPE_LINKS in the large historical index.html are a separate
  code path. They are empty at the verified main version and were not modified.
- Existing image assets, shop prices, shipping rules and approved design untouched.
- Publishing any PR may trigger Netlify previews. This branch is not merged or deployed.

## Human review steps

1. Review the diff only and verify canonical deployment repository/settings.
2. Confirm Stripe Payment Link host/domain and environment variables on Netlify.
3. Verify current Instagram professional login mode and token permissions.
4. Run tests locally and check checkout, catalog and post images in a supervised preview.
5. Approve production only after platform, secret redaction and payment QA.

Status: CODE_COMMITTED / LOCAL_TEST_EXECUTED / PRODUCTION_HOLD.
