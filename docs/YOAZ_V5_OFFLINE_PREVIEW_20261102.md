# YOAZ — V5 autonome avec œuvres et 11 logos originaux (2 novembre 2026)

## Objectif
Corriger la limite bloquante des prototypes V2–V4 : **les images du portfolio ne chargeaient pas dans les captures et l'environnement de prévisualisation**. L'utilisateur veut conserver le site d'origine, les dessins et les 11 logos clients, avec un traitement typographique plus éditorial, mais ni ultrafin ni énorme.

## Artefact livré sur la branche isolée
`previews/YOAZ_V5_OFFLINE_20261102.html`

- HTML **autonome** (fichiers image intégrés en `data:image/*;base64`, pas d'appel à un serveur, pas de bibliothèque ou police externe).
- **22 fichiers d'images réels** issus de `yooaz/yoaz-portfolio` : cheval original compressé `hero-cutout.webp`, trois vrais visuels clients (Adobe, Adidas Paris, PlayStation), cinq posters repris tels que nommés sur le site, quatre images de la galerie personnelle et **11 logos PNG originaux**. Une œuvre peut être réutilisée dans deux emplacements : 28 balises image pointent vers 22 ressources uniques.
- Les logos suivent l'ordre exact du site : Adobe, Apple, Nike, Adidas, PlayStation, Marvel, Fortune, Cadillac, Converse, Asics, Visa. Fichiers blancs présentés sur fond noir, sans remplacement par des noms typographiques ou de faux logos.
- Hiérarchie éditoriale : titres sans-serif en graisses 650–780 ; grille clients en trois colonnes (première mise en valeur), marques sur quatre colonnes desktop / trois colonnes mobile ; affiches sur cinq colonnes puis deux en petit écran.
- Toutes les grandes sections conservées dans le prototype : accueil → travaux clients → logos → posters → galerie → motion → à propos → Instagram → FAQ → contact.
- Le prototype se concentre sur la direction visuelle : seules trois collaborations et quatre œuvres personnelles sont visibles. **Ce n'est pas une réduction validée du portfolio de production**, qui doit conserver toutes les œuvres existantes.
- Aucun formulaire réel, paiement, flux Instagram en direct ni script Analytics dans le fichier autonome. Balise `noindex,nofollow`.

## Contrôles réalisés
- Lecture du blob sur GitHub et validation indépendante des **22 éléments** `data:image` : signatures de fichiers PNG, WebP et JPEG, 11 logos, 5 posters, 3 visuels clients, 4 cartes personnelles, sans référence image manquante ; vérification des 2 scripts inline pour absence d'erreur de syntaxe JS.
- **Un peu plus de 1,9 Mo** pour le HTML autonome, environ 1,43 Mo d'images binaires d'origine.
- Suite de protection ajoutée dans `tests/yoaz-v5-offline-preview.test.cjs`, lancée à l'avenir par `npm test`.
- **Limite importante :** les tests du dépôt n'ont pas encore été exécutés sur un checkout complet et la page intégrée n'a pas été observée en rendu réel sur Safari/Chrome/iPhone (layout à confirmer). La validation faite porte sur la complétude des ressources et du code, pas sur les Core Web Vitals.

## Ouvrir la maquette
1. Aller sur le fichier de prévisualisation dans la branche GitHub.
2. Cliquer **Download raw file** et enregistrer sous `YOAZ_V5_OFFLINE_20261102.html`.
3. Ouvrir le fichier avec Chrome ou Safari, même hors ligne. Les images doivent être présentes sans connexion. Aucun fichier annexe n'est requis.

## Sécurité et publication
- Fichier conçu uniquement pour valider une direction graphique. Il est séparé de `index.html` et de la publication en ligne.
- Pas de token API, de clé Stripe, de flux Instagram simulé comme réel, d'accès Netlify, de PR ou de merge dans `main`.
- Seules des modifications supplémentaires et réversibles sur la branche `work/yoaz-qa-mobile-no-deploy-20261102` ont été réalisées.
