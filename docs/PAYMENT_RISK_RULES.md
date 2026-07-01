# Yoaz Shop — Payment Risk Rules

Use Stripe Checkout first. Keep Stripe Radar enabled. Never store card data yourself.

## Automatic fraud signals to flag

Flag an order for manual review when one or more of these is true:

- Stripe `risk_level` is `highest` or `elevated`.
- CVC check fails or postal/ZIP check fails.
- Billing country and shipping country are different.
- Customer IP country differs from shipping country.
- Email looks disposable or suspicious.
- Order value is unusually high for a first order.
- Multiple failed payment attempts within a short time.
- Many orders to different shipping addresses from same email/IP.
- Shipping address is incomplete, PO box, freight forwarder, or uses strange formatting.
- Customer asks to change shipping address after payment.

## Safe workflow

1. Payment completed in Stripe Checkout.
2. Webhook creates order with status `paid_pending_review`.
3. Risk score is computed.
4. If risk is low: `approved_for_fulfillment`.
5. If risk is medium/high: hold order and manually verify before Gelato.
6. Only send to Gelato after review is passed.

## Important

This does not replace Stripe Radar. It adds a second layer to avoid sending expensive print-on-demand orders to suspicious addresses.
