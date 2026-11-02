# YOAZ — direction artistique V3 (aperçu isolé, non publié)

## Décision et direction

Après plusieurs essais trop minimalistes, trop fins ou photographiques, revenir au portfolio existant et préserver son identité : illustrations psychédéliques, cheval original, logos clients, tous les travaux et cinq posters, et ordre des sections.

- **Typographie** : une seule famille Inter Display / Inter, titres 560–650, textes 400–600, contraste entre grands titres et petits index de section. Pas de serif décorative ni d'ultrafine.
- **Grille** : cartes projets plus généreuses, quelques cartes plus larges dans une sélection éditoriale, mais aucune suppression des travaux du site de production.
- **Couleurs** : ivoire doux, charbon et un accent doré très discret. Les couleurs fortes viennent exclusivement des œuvres originales.
- **Accessibilité** : cibles tactiles lisibles, états focus, motion réduite.
- **Contenus** : accueil et cheval conservés ; ordre Clients → Logos → Posters → Galerie → Motion → À propos → Instagram → FAQ → Contact.
- **Éditorial** : 12 projets, 11 marques, 5 posters et 12 œuvres personnelles dans le prototype indépendant. Le site de production conserve ses ensembles complets.

## Code ajouté dans GitHub

- `assets/css/yoaz-editorial-v3-option.css` : proposition CSS **facultative**, destinée à une validation en copie. **Le fichier n'est pas inclus dans `index.html`.**
- `tests/yoaz-editorial-v3.test.cjs` : garde du caractère opt-in, de l'identité graphique et de la présence des éléments existants. Intégré à `npm test`.
- Le prototype HTML est un fichier livré dans la conversation, distinct du dépôt. Il inclut une fenêtre d'image, un menu mobile et des liens vers les images originales. Les liens vers les images pointent vers yoaz.fr, avec repli sur le dépôt public GitHub.

## Contrôles et limites

- Le prototype HTML a été testé en local sur Chromium aux largeurs 320, 360, 390, 600, 768, 1024, 1440 et 1920 px : **aucun débordement horizontal** après correction d'un titre Motion. Une ouverture/fermeture de dialogue et du menu mobile ont été vérifiées.
- Le navigateur d'essai local ne peut pas récupérer les images distantes ; **la visibilité réelle de celles-ci n'a pas été validée**. Les liens directs vers les images originales servent de secours, mais ne remplacent pas les illustrations dans un aperçu sans réseau.
- Les images de Fast Company et Mira ne sont pas mises en avant dans la V3 tant que les attributions ne sont pas vérifiées.
- La suite `npm test` du dépôt complet et une vraie revue desktop/iPhone/iPad avec images chargées restent nécessaires.
- Aucune fusion dans `main`, aucun changement du site publié, aucun appel à Netlify ni publication de la maquette.

L'utilisateur doit pouvoir valider la composition, la typographie et la hiérarchie avant toute activation.
