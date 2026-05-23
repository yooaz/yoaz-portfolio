# Yoaz v19 — targeted refinement from original base

This version keeps the original site structure and visual identity, then improves the specific UX issues requested.

## Main fixes
- Kept the original base design instead of replacing it with a new concept.
- Mobile hero is now readable: the main horse/header image uses `object-fit: contain` on phone so the artwork is not aggressively cropped.
- Client Work remains grid-like on desktop, but becomes swipeable on mobile.
- Removed the red “VOIR LA SÉRIE” band from client cards.
- Client project modal is clearer on mobile: larger readable text, full-screen layout, visible close button, non-cropped images.
- Project images remain swipeable inside the modal.
- Personal gallery is more dynamic but still keeps artworks visible with `object-fit: contain`.
- Gallery lightbox supports clear close, background click exit, keyboard arrows, and mobile swipe.
- Shopify print section is visually integrated as a premium print rail without making the portfolio feel generic.
- Added extra SEO/GEO/LLM reinforcement metadata and ItemList JSON-LD for selected client work.
- Updated llms.txt and llms-full.txt with 2026 implementation notes.

## Deployment
Upload the full folder to Netlify or Vercel. Keep `/images`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/ai.txt`, `/sitemap.xml`, and `index.html` at the root.
