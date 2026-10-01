# YOAZ.FR — Cloudflare Pages free migration

Prepared branch: `cloudflare-pages-free`

## Goal
Move the site off Netlify so normal static traffic does not consume Netlify credits.

## Cloudflare Pages project settings
- Git repository: `yooaz/yoaz-portfolio`
- Production branch: `cloudflare-pages-free` for testing, then `main` after validation
- Framework preset: None
- Build command: leave empty
- Build output directory: `/`

## Required environment variables
Copy the existing values from Netlify into Cloudflare Pages > Settings > Environment variables / Secrets.

Instagram:
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_USER_ID` (optional if Basic Display fallback is sufficient)
- `INSTAGRAM_LIMIT` (optional, default 9)

Stripe — simplest mode, preferred:
- `STRIPE_LINK_CHAOS_HORSE`
- `STRIPE_LINK_FACES`
- `STRIPE_LINK_PALM_GUARDIANS`
- `STRIPE_LINK_PORTAIL`
- `STRIPE_LINK_CITE_PSYCHEDELIQUE`
- `STRIPE_UNIVERSAL_PAYMENT_LINK` (optional fallback)

Stripe — optional advanced mode:
- `STRIPE_SECRET_KEY`
- `SITE_URL=https://yoaz.fr`

## Compatibility already added on this branch
- `/functions/api/instagram-feed.js` — Cloudflare Pages Function
- `/functions/api/create-checkout.js` — Cloudflare Pages Function
- `/_redirects` — keeps the old `/.netlify/functions/...` front-end URLs working
- `/_routes.json` — only invokes Functions for `/api/*`; static pages/assets stay static
- Existing `/_headers` remains usable by Cloudflare Pages for static responses

## Domain cutover
After the Cloudflare preview is validated:
1. Add `yoaz.fr` as a custom domain in the Pages project.
2. Add `www.yoaz.fr` and redirect it to `https://yoaz.fr` at the zone level.
3. Point DNS to Cloudflare Pages as instructed by Cloudflare.
4. Keep the old Netlify project untouched until DNS/HTTPS are confirmed.

## Validation checklist
- Home page loads
- All portfolio images load
- Mobile layout works
- Contact form still posts to Formspree
- Instagram section returns live posts
- Shop buttons return valid Stripe checkout/payment links
- `/robots.txt`, `/sitemap.xml`, `/llms.txt` load
- `https://www.yoaz.fr` redirects to `https://yoaz.fr`
- HTTPS certificate valid

No secrets are committed to GitHub.
