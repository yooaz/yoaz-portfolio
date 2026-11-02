# YOAZ — Direction visuelle 2026 (proposition, non publiée)

## Règles conservées

- **Aucun déploiement Netlify, aucune fusion `main` ni PR** dans ce chantier.
- Le cheval original, les images clients, les logos de marques et les cinq posters restent la référence. Pas de photos artificielles ni de nouveaux clients inventés.
- L'ordre d'accueil ne change pas : cheval / clients / outils et logos / posters / galerie / motion / à propos / Instagram / FAQ / contact.
- La refonte radicale de la PR #21 reste **abandonnée**. Cette proposition est éditoriale, progressive, réversible.

## Concept proposé

**Artworks first.** Le site devient plus lisible et premium avec une typographie sans empattement large, un espacement régulier, des boutons simples et une grille d'images généreuse. L'art très coloré reste la vedette ; l'interface utilise une palette neutre issue du site actuel.

| Élément | Proposition |
|---|---|
| Surface | ivoire `#f4f0e7` |
| Texte | noir chaud `#151512` |
| Contraste galerie | charbon `#171715` |
| Accent | or doux `#9b7845` |
| Titres | Arial Black / sans, composition éditoriale, graisse forte |
| Travail client | cartes cohérentes avec légendes visibles et retour clair |
| Collection | les cinq affiches existantes, sans altérer les achats |
| Mobile | cheval visible, CTA accessibles, 2 colonnes max sur la grille, pas de débordement horizontal |

## Livrables

1. Prévisualisation HTML autonome préparée pour l'utilisateur (hors site, hors Netlify). Elle charge les visuels **existants** depuis le dépôt public GitHub `yooaz/yoaz-portfolio`. Son dialogue d'images, le menu mobile et les ancres internes sont fonctionnels ; le commerce est volontairement désactivé.
2. Feuille CSS expérimentale dans `assets/css/yoaz-visual-option-2026.css`, **non chargée** par l'accueil de production ni par la branche. Elle cible le DOM existant afin de permettre un essai opt-in, sans importer d'image, script ni police supplémentaire.
3. QA du prototype sur Chromium en mode document local, sans chargement des images distantes par le navigateur de test : desktop 1440 px, mobile 390 px, **aucun débordement horizontal**, 9 sections d'origine, 16 cartes clients présentées, 11 logos, 5 affiches, 19 visuels personnels, menu mobile et fenêtre d'image fonctionnels, aucune erreur JavaScript de page. L'affichage réel des images distantes devra être contrôlé par le destinataire avec une connexion internet.

## Point éditorial à vérifier avant publication

L'asset `images/client-fast-company.jpg`, actuellement associé à Fast Company dans l'accueil et une page projet, **affiche en fait un packaging Mira Brasserie** sur le site public inspecté. `images/client-cadillac.jpg` affiche, en revanche, une illustration éditoriale titrée « NEXT », avec une mention Facebook, plus cohérente avec un travail de presse. Il faut valider l'attribution exacte avec les originaux avant de remplacer les images ou de publier la page Fast Company. Aucun fichier d'œuvre n'a été renommé ou supprimé pour éviter une mauvaise attribution.

## Étape suivante

- Vérifier les vrais visuels client par client et leur droit de publication.
- Activer la feuille de style sur une **copie hors production**, comparer l'ancien et le nouveau rendu sur Safari/Chrome/iPhone/iPad, puis corriger les conflits de cascade.
- Exécuter la suite de tests Node sur un checkout complet et tester sans données réelles les interactions, les traductions, la boutique et Instagram.
- Soumettre à la validation de l'utilisateur **avant** toute intégration au site public.

Ce document est un cahier de direction visuelle, pas une confirmation de déploiement.
