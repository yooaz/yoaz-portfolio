# YOAZ V3.7 — Images restored

Fix ciblé après test mobile local.

## Problème
Les versions V3.2 à V3.6 contenaient uniquement les fichiers HTML/MD et n'embarquaient plus le dossier `images/`. Résultat : le navigateur affichait les textes ALT à la place des images.

## Correction
- Dossier `images/` restauré depuis la dernière version complète V3.
- Dossier `images/projects/` restauré.
- Fichiers SEO conservés : `robots.txt`, `sitemap.xml`, `image-sitemap.xml`, `llms.txt`, `llms-full.txt`, `humans.txt`, `ai.txt`, `manifest.webmanifest`.
- Dernier `index.html` conservé avec les corrections mobile / social / Stripe.

## À tester
- Hero mobile : image cheval visible.
- Galerie client : images visibles.
- Posters : images visibles et non coupées.
- Réseaux sociaux : pas de `undefined`.
- Boutons Acheter : Stripe ou fallback configuré.
