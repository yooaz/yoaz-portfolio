# YOAZ V6 — affinage éditorial sans publication (2 novembre 2026)

## Direction choisie

Cette passe poursuit la V5 et respecte les retours de l'artiste : **le design d'origine reste la base**, les logos clients sont indispensables, la typographie ne doit être ni ultrafine ni massive, et **aucune photographie générique ou œuvre inventée** n'est autorisée.

- Typographie sans-serif en graisses 630–730, composition plus compacte, contraste titre/légende.
- Cheval géométrique original préservé et dominant en hero ; titre YOAZ mieux proportionné.
- Travaux clients en sélection asymétrique **5 projets** : Adidas Paris, PlayStation / God of War, Adobe, Hoppy Japan, Converse (Made by You), tous vérifiés visuellement contre les fichiers sources.
- **11 logos PNG d'origine**, ordre préservé, grille 4 colonnes desktop, 3 colonnes tablette et 2 colonnes téléphone ; le dernier logo remplit proprement la dernière rangée.
- **5 posters existants**, inchangés.
- Galerie personnelle étendue à **7 dessins** (Horizon, Florale, Portail, Cité psychédélique, Soleil, Métamorphose, Âmes jumelles). Le visuel principal est plus large, sans découper l'œuvre.
- Sections conservées en prototype : hero → travaux clients → logos → posters → travaux personnels → motion → à propos → Instagram → FAQ → contact.
- Le prototype est une **sélection** et non une proposition de supprimer les autres projets présents sur yoaz.fr.

## Fichiers sur la branche isolée

1. `previews/YOAZ_V6_EDITORIAL_OFFLINE_20261102.html` — **autonome sans réseau**, avec **27 fichiers graphiques originaux** intégrés sous forme de data URI (dont 11 logos). Il ne requiert ni police ni JavaScript externes, affiche un avertissement « NON PUBLIÉ » et utilise `noindex,nofollow`.
2. `assets/css/yoaz-editorial-v6-option.css` — **proposition facultative** appliquable à une copie du vrai `index.html`. Cette feuille CSS **n'est pas référencée par l'accueil**, et ne retire pas les 17 cartes clients, les 5 affiches ou les logos existants.
3. `tests/yoaz-v6-offline-preview.test.cjs` — vérifie le nombre, les signatures PNG/JPEG/WebP, les chemins et l'ordre des médias intégrés, les sections, l'absence de scripts distants et le caractère isolé.
4. `tests/yoaz-editorial-v6-option.test.cjs` — vérifie le maintien des onze fichiers logo originaux, des sections et des cinq posters. Les deux tests sont ajoutés à `npm test`.

## Vérifications effectives

- Images Hoppy Japan, Converse, Soleil, Métamorphose et Âmes jumelles ouvertes et inspectées depuis les octets exacts du dépôt GitHub.
- Vérifications en mémoire des sources V6 : **27 images intégrées, 5 cartes projet, 7 œuvres personnelles, 11 logos, 5 posters** ; chaque balise image du prototype référence un fichier embarqué ; syntaxe des deux scripts inline validée.
- La branche `main` et `index.html` ne sont pas modifiés.
- **En attente** : exécution native de toute la suite `npm test` dans un checkout, rendu réel en navigateur avec cette version V6, comparaison visuelle Safari/Chrome/iPhone, vérification d'Instagram/Stripe/Formspree/Analytics et validation par l'artiste. Ne pas présenter la V6 comme une version déjà publiée ou prête à fusionner.

## Ouvrir la V6 hors ligne

Sur GitHub, ouvrir le fichier V6 dans la branche `work/yoaz-qa-mobile-no-deploy-20261102`, choisir **Download raw file**, enregistrer le fichier `.html` puis l'ouvrir avec Safari ou Chrome. La page inclut les images : aucun téléchargement d'images supplémentaire n'est nécessaire.

**Ne pas déclencher Netlify, merge dans main, ni déploiement, sans autorisation explicite.**
