# YOAZ — refonte éditoriale (novembre 2026)

## Architecture et sauvegarde

La nouvelle version est créée sur la branche **feature/yoaz-editorial-refonte-20261102** du dépôt **yooaz/yoaz-portfolio**. La branche principale et la version actuellement publiée sur **https://yoaz.fr** restent intactes.

La page d'accueil a été remplacée sur cette branche par une version HTML, CSS et JS modulaire. Tous les anciens visuels et contenus du dépôt restent disponibles dans l'historique Git.

- index.html — HTML sémantique, navigation, projets, galerie, boutique, formulaire, métadonnées.
- assets/css/yoaz-v2.css — style premium responsive.
- assets/js/yoaz-v2.js — menu, langues FR/EN/NL/ES, filtres, visionneuse, checkout.
- netlify.toml — runtime Node 22 et cache CSS/JS revalidable.
- scripts/check-yoaz-v2.mjs — contrôles de base du portefeuille.

## Hébergement Netlify confirmé

Le dépôt GitHub **yooaz/yoaz-portfolio** est relié au projet Netlify **superb-custard-609f96**, dont l'URL principale est **https://yoaz.fr**.

- Projet : https://app.netlify.com/projects/superb-custard-609f96
- Prévisualisation de la pull request #21 : https://deploy-preview-21--superb-custard-609f96.netlify.app
- Pull request : https://github.com/yooaz/yoaz-portfolio/pull/21
- Premier déploiement de prévisualisation : réussi (Netlify a confirmé 'ready').
- CI GitHub Actions (contrôles statiques) : réussie.

Il existe également un second projet Netlify, jade-axolotl-4768d6, attaché au même dépôt et ayant généré une autre prévisualisation. Ne pas modifier ses paramètres de production sans vérification.

**Aucun déploiement en production n'a été effectué pour cette refonte.**

## Vérifications avant fusion

1. Vérifier le rendu visuel de la prévisualisation sur Mac, mobile, tablette, ainsi que les boutons et dialogues au clavier.
2. Vérifier chaque projet et son visuel, y compris les 12 collaborations et les 8 œuvres.
3. Tester le formulaire Formspree et les 5 checkouts Stripe avec des moyens de paiement de test sur le projet Netlify cible. Les secrets restent côté Netlify.
4. Vérifier le consentement analytique pour le GTM historique (GTM-WLJNC5JN).
5. Mesurer Lighthouse/LCP/CLS et contrôler les contrastes/accessibilité.
6. Confirmer explicitement la publication sur yoaz.fr avant fusion vers main.

## Tests

- node --check assets/js/yoaz-v2.js
- node scripts/check-yoaz-v2.mjs

Les deux sont lancés automatiquement sur les pull requests par le workflow GitHub Actions.

La refonte privilégie une galerie éditoriale concise. Les autres projets et l'archive de la version précédente restent disponibles pour de futures pages détaillées.
