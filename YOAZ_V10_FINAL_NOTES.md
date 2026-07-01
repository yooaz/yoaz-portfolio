# YOAZ V10 Complete Fix

Applied:
- Hero text and typography corrected to the validated reference direction.
- Literal `<BR>` issue removed/overridden.
- Client logos replaced with monochrome Simple Icons CDN SVGs.
- Social icons added for Instagram, Behance, Dribbble, LinkedIn, Vimeo, Foundation, Linktree.
- Client gallery text forced white and overlays improved.
- Personal gallery kept ivory/light and lightbox next/prev rebuilt.
- Shop reduced to curated 50×70 poster editions at 89 € shipping included.
- Stripe backend product list aligned with the curated shop.
- SEO/LLM artwork schema added.

Stripe:
Set `STRIPE_SECRET_KEY` in Netlify environment variables and redeploy.
Stripe Checkout collects customer email, phone, billing address and shipping address. Review payment in Stripe/Radar before manually ordering through Gelato.
