# YOAZ — V8 / refonte visuelle avec garde-fous SEO (2 novembre 2026)

## Résultat

Deux alternatives sur branche isolée, **sans aucun déploiement Netlify** :
- `previews/YOAZ_V8_EDITORIAL_IMAGES_SEO_SAFE_20261102.html` : prototype V8 compact, 42 placements d'images qui chargent les visuels originaux du site existant.
- `previews/YOAZ_V8_CORE_IMAGES_EMBEDDED_20261102.html` : le même prototype avec **31 placements d'images intégrés directement** (cheval, 5 projets, les 11 logos clients, les 5 vrais posters et plusieurs originaux). Les 10 images supplémentaires de la grande galerie sont chargées depuis `https://yoaz.fr/images/` et nécessitent donc Internet ; aucun visuel générique ni inventé.

La version autonome ne dépend pas des URLs distantes pour ses éléments visuels essentiels, contrairement à la V7.

## Direction graphique

- Site actuel comme base : typographie sans-serif plus éditoriale, graisses moyennes/fortes sans ultrafin ni noir massif.
- Cheval géométrique original en tête (mobile d'abord), mise en avant des collaborations, titres plus clairs.
- **11 logos d'origine** et leur ordre conservés ; aucun logo remplacé par du texte.
- **5 tirages authentiques du site actuel** : Chaos Horse, Faces, Palm Guardians, Portail et Cité Psychédélique (les images V7 avaient été prises dans la galerie au lieu de la véritable sélection posters).
- **19 illustrations personnelles** dans la galerie de la maquette ; artworks affichés en `object-fit: contain` pour éviter le recadrage.
- Sections retrouvées : hero → travaux clients → outils/logos → posters → œuvres personnelles → motion → à propos → Instagram → FAQ → contact.
- Liens Instagram vers `@iamyoaz`, liens projets existants, pas de faux flux Instagram.
- Paiement Stripe et formulaire de contact **non simulés** dans le prototype. Le site original et ses 17 réalisations clients ne sont pas modifiés par la maquette.

## Préservation du référencement

La V8 est une page de prévisualisation avec `noindex,nofollow` pour **éviter qu'une maquette de travail soit indexée**. Cette balise ne doit **jamais** être copiée sur la page publique.

La feuille `assets/css/yoaz-editorial-v8-option.css` est **facultative et non incluse** dans `index.html`. Elle ne remplace ni ne retire :
- les méta title/description, robots, canonical, Open Graph, Twitter, données structurées JSON-LD ;
- les langues FR / EN / NL / ES et déclarations hreflang déjà présentes ;
- les 13 URL du sitemap actuel (accueil + 6 projets FR et EN) et le sitemap d'images ;
- les images, `alt`, textes, FAQ, liens internes ou pages projet ;
- les scripts de statistiques, Instagram, Formspree, Stripe et les éléments du shop.

La suite `tests/yoaz-v8-seo-visual.test.cjs` est ajoutée à `npm test`. Elle protège la page canonique, les métadonnées, le catalogue et les assets et détecte l'activation accidentelle de V8 sur la production.

**Attention :** préserver les balises et URLs existantes est une mesure anti-régression, pas la garantie d'une position dans Google. La traduction de chaque page, les Core Web Vitals, la validité de tous les liens et les fonctionnalités réelles devront être vérifiés en préproduction.

## QA effectuée / limites

- Vérification statique de la maquette V8 : 42 placements `img`, 19 travaux personnels, 5 posters, 5 projets en sélection, 11 logos, un seul `h1`, aucun ID dupliqué, ancrages cohérents, `noindex` sur la maquette seulement.
- Les 31 placements intégrés proviennent des octets déjà utilisés par le prototype V6 (format MIME d'origine respecté).
- Le fichier V8 ne remplace ni `index.html`, ni les images de la production.
- `npm test` est à exécuter dans un checkout complet avant fusion ; les nouveaux tests ont été ajoutés mais **leur exécution n'est pas confirmée dans cet environnement**.
- Rendu visuel Safari / Chrome / iOS, paiement, traduction, formulaire, analytics et métriques réelles de performance restent à contrôler avant toute activation.

## Politique de publication

Aucun merge dans `main`, aucun déploiement Netlify. Cette proposition attend validation visuelle et vérification des liens SEO/canoniques de toutes les études de cas.
