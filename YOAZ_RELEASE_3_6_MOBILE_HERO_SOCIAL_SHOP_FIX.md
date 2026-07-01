# YOAZ Release 3.6 — Mobile hero + social undefined + poster image fix

## Fixed
- Mobile hero order changed to image first, then copy.
- Hero image uses contain on mobile, never aggressive crop.
- Social row is regenerated from a locked whitelist: Instagram, Behance, Dribbble, LinkedIn, Facebook, Linktree.
- Removed any social item that renders `undefined` or has an invalid href.
- Mobile shop poster images use object-fit: contain so Chaos Horse and other vertical posters are not cropped.

## Notes
- Desktop hero remains hidden/replaced only at mobile breakpoint.
- Stripe security patch from 3.5 is preserved.
