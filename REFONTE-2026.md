# YOAZ — refonte éditoriale (novembre 2026)

## État du projet
Travail proposé uniquement sur la branche \`feature/yoaz-editorial-refonte-20261102\`, **sans écraser la branche \`main\` ni déployer en production**.

Le site existant, la médiathèque \`images/\`, la fonction Stripe Netlify \`netlify/functions/create-checkout.js\`, le formulaire Formspree, les liens sociaux et les pages auxiliaires demeurent dans le dépôt. La page d'accueil est remplacée sur cette branche par un site statique modulaire :

- \`index.html\` — HTML sémantique, métadonnées, projets, galerie, collection, contact.
- \`assets/css/yoaz-v2.css\` — design responsive, typographie, menu mobile, mode accessibilité.
- \`assets/js/yoaz-v2.js\` — langues FR / EN / NL / ES, filtres, visionneuse accessible, achat Stripe.
- \`netlify.toml\` — mise à jour Node 22 et cache CSS/JS revalidable.

## Aperçu et mise en ligne

1. Vérifier d'abord les CI du dépôt (si GitHub Actions est activé).
2. Sur Netlify, ouvrir le **site existant yoaz.fr** et vérifier qu'il est connecté au dépôt GitHub \`yooaz/yoaz-portfolio\`. Les comptes Netlify actuellement accessibles à ChatGPT ne montrent pas ce site, donc **la liaison GitHub ↔ Netlify et le domaine personnalisé ne peuvent pas être confirmés depuis ici**.
3. Si le site est lié à GitHub, activer les Deploy Previews pour les pull requests et regarder le rendu de la branche.
4. Contrôler visuellement desktop / mobile, traductions, modale, formulaire et Stripe en mode test avant fusion.
5. Déployer sur le domaine public uniquement après validation expresse.

### Points à valider avant publication

- Les visuels sélectionnés correspondent aux bons projets et disposent des droits de publication.
- Le site complet conserve bien les fichiers d'images originaux.
- Les 5 liens de paiement Stripe ou \`STRIPE_SECRET_KEY\` sont configurés sur **le bon site Netlify** (jamais dans GitHub).
- Le formulaire Formspree \`xlgpnrze\` reçoit correctement les demandes.
- Le tracking GTM \`GTM-WLJNC5JN\` suit bien la politique de consentement applicable.
- La configuration DNS de \`yoaz.fr\` reste inchangée.

## Contrôles
Exécuter \`node --check assets/js/yoaz-v2.js\` puis \`node scripts/check-yoaz-v2.mjs\`.

La galerie est volontairement éditorialisée autour de 12 projets clients et 8 œuvres personnelles ; l'archive existante reste dans Git et peut être réintroduite dans des pages projets dédiées. Le style est conçu pour laisser l'œuvre faire la couleur, avec une interface neutre et de grands visuels.
