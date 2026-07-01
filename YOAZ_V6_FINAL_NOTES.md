# YOAZ V6 Final Notes

- Palette unified: ivory / black / soft gold.
- Client marks are implemented as inline monochrome SVG-style brand marks in the client strip.
- Client gallery cards use white titles/subtitles on a softer black overlay.
- Project modal is black with white text and gold tags.
- Footer YOAZ is visible on black.
- Shop is set to 89 EUR shipping included.
- Stripe Checkout function amount is set to 8900 EUR cents.

## To activate Stripe
Set `STRIPE_SECRET_KEY` in Netlify environment variables.
Optional: add `STRIPE_WEBHOOK_SECRET` + webhook later if you want automatic email/order notifications.
For now, paid orders are visible in Stripe Dashboard and the checkout success page confirms the order.
