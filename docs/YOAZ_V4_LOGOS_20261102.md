# YOAZ — direction artistique V4 : logos conservés et valorisés

## Demande
L'utilisateur apprécie la présence des logos de marques sur la version originale de son site. Préserver intégralement les fichiers et leur ordre, avec un rendu plus éditorial, sans accentuer excessivement la finesse typographique ni réinventer les dessins.

## Prototype visuel livré dans la conversation
- Fichier HTML de prévisualisation `YOAZ_direction_artistique_V4_logos.html` (indépendant et hors production).
- 11 logos d'origine : Adobe, Apple, Nike, Adidas, PlayStation, Marvel, Fortune, Cadillac, Converse, Asics et Visa, dans cet ordre.
- Section de collaborations après la galerie client, avec titrage structuré, grille 4 colonnes sur ordinateur et 3 sur mobile.
- Les vrais PNG chargent depuis les chemins `https://yoaz.fr/images/brand-white-*.png` avec repli GitHub public. Si le navigateur empêche ces accès, seule une étiquette typographique du nom de la marque apparaît. Ne pas confondre ces étiquettes avec les logos d'origine.
- 12 cartes projets sélectionnées, 5 posters et 12 œuvres dans ce prototype, sans changement d'ordre des sections.

## Changements enregistrés dans GitHub
- `assets/css/yoaz-brandwall-v4-option.css` : style facultatif ciblant exclusivement la vraie rangée de logos `.yoaz-home-trust .yoaz-real-logo-row.yoaz-visible-client-logos`.
- `tests/yoaz-brandwall-v4.test.cjs` : garde de présence, d'ordre, de chemins et d'alternatives textuelles pour les 11 vrais logos, maintien du cheval et des 5 posters, dimensions mobiles.
- `package.json` : le test fait partie de `npm test`.

## QA et limites
- Prototype : Chromium local à 320, 390, 768, 1024, 1440, 1920 pixels ; largeur de document == largeur de fenêtre ; 11 logos, 12 cartes, 12 œuvres et 5 posters confirmés.
- Ouverture et fermeture du menu mobile et de la fenêtre de visuel vérifiées dans le prototype.
- Chargement distant des fichiers image impossible dans le navigateur de test isolé : les aperçus de logos en capture montrent leurs noms de secours, non les PNG. Les vrais chemins ont été vérifiés dans le code de GitHub au préalable.
- La suite complète `npm test` de GitHub n'a pas été exécutée dans un checkout complet.

**Aucun site public, aucune connexion Netlify, aucune fusion main ni pull request.** La nouvelle feuille facultative n'est pas chargée dans `index.html`.
