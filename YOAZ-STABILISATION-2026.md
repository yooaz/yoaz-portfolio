# YOAZ — Stabilisation du site actuel (2 novembre 2026)

## Règles impératives
- **Ne pas utiliser, déclencher ou configurer Netlify** dans ce chantier.
- **Ne pas fusionner la branche de travail dans main**, ouvrir une PR ou publier sur yoaz.fr sans validation explicite.
- Garder les illustrations, les logos clients, les 5 posters, le cheval et l'ordre actuel des sections.
- La refonte radicale proposée en PR #21 a été abandonnée. Le chantier de référence est l'issue #22.

## Branche isolée
`work/yoaz-stabilisation-sans-netlify-20261102`

Le `main` d'origine conserve le blob `index.html` SHA `1832d7a971d6a7a9206d6cb6e3c810ab2e6379f6`. L'accueil sur la branche garde l'ordre :
hero → travaux clients → outils/logos → posters → travaux personnels → vidéo → à propos → Instagram → FAQ → contact.

## Changements réalisés dans le code

### Fiabilité / Instagram
- Un seul contrôleur d'affichage : `assets/js/yoaz-instagram-stable.js`.
- Les anciennes routines concurrentes (Behold, API, fallback local) ne remplacent plus `#ig-grid`.
- Si l'API est indisponible, les œuvres locales restent visibles, sans les présenter comme des posts récents, et les liens pointent vers `@iamyoaz`.
- Le contrôleur valide les URL, crée les éléments avec le DOM plutôt que `innerHTML` et dispose d'un délai maximal de 8 secondes.
- `netlify/functions/instagram-feed.js` utilise Meta Graph v26.0, un jeton côté serveur (Authorization Bearer), un cache et des erreurs publiques non sensibles. L'ancienne API Basic Display est supprimée.
- Pour un vrai feed automatique, configurer un jeton **professionnel** valide via le mécanisme d'hébergement existant. Aucune clé n'a été copiée dans le code.

### Formulaire / paiements
- `assets/js/yoaz-contact-stable.js` : gestionnaire unique Formspree, garde de soumissions multiples, timeout, succès et erreur accessibles, lien mail direct en secours.
- `assets/js/yoaz-checkout-stable.js` : contrôleur d'achat unique, trois anciens handlers neutralisés, revalidation URL Stripe avant redirection, messages d'erreur clairs.
- Endpoint Checkout : parsing JSON et taille de requête contrôlés, destinations Stripe autorisées, erreurs serveur génériques, prix gardés côté serveur.
- La disponibilité des vrais liens Stripe et la réception Formspree nécessitent des tests d'intégration : **non confirmées**.

### SEO et typographie
- Page d'accueil visuellement conservée ; un petit style ciblé améliore la lecture de YOAZ, du descriptif et des liens projets.
- 5 projets disposent de pages FR + EN indexables : Adobe MAX, PlayStation God of War, Adidas Paris, Converse × Citadium, Relic Cipher.
- Liens textuels indexables depuis la section Travaux Clients de l'accueil ; si l'utilisateur choisit EN/NL/ES, navigation vers les versions anglaises.
- `sitemap.xml` n'utilise plus de fausses URL à fragments `/#...` ; 11 vraies URL avec hreflang FR/EN.
- `llms.txt` pointe vers ces pages officielles. Cela facilite la découverte, **sans garantie** de classement dans Google ou de citation dans ChatGPT.

### Performance / sécurité
- Observateurs des logos limités à la zone clients au lieu de réagir à toutes les mutations du document ; délais de reprise réduits.
- Node 22 déclaré pour la configuration future, cache des ressources non versionnées corrigé.
- Pas de nouvelle clé d'API dans GitHub.
- À traiter plus tard, seulement après QA visuelle : refactor progressif du `index.html` monolithique de ~900 Ko et CSP encore trop permissive (`unsafe-inline`, `unsafe-eval`).

## Vérifications déjà réalisées (sans Netlify)
- Contrôle statique de toutes les balises script inline du site ; aucune erreur de syntaxe JavaScript ou JSON-LD.
- 20 chemins d'images utilisés par les pages projets existent sur GitHub.
- Contrôle de l'ordre des sections, des logos et des 5 posters.
- 12 assertions simulées de backend Instagram et Stripe réussies, sans appel réseau externe.
- Tests reproductibles : `node --test tests/yoaz-current.test.cjs`, workflow GitHub `.github/workflows/yoaz-current-offline-tests.yml`.
- La branche `main` et le site publié sont restés inchangés.
- Aucun déploiement Netlify n'a été demandé. L'absence de statuts Netlify sur la branche a été constatée lors des derniers contrôles GitHub.

## Vérifications obligatoires avant une future publication
1. Tests interactifs au navigateur sur desktop / iPhone / iPad (menu, galerie, logo strip, quatre langues, mises en page, achats, formulaire).
2. Meta : compte Creator/Business, permissions, jeton et affichage de vrais posts ; vérifier le lien Instagram depuis un navigateur non authentifié.
3. Stripe : test sur chaque produit avec lien ou session en environnement test ; aucun paiement réel automatique.
4. Formspree : envoi d'un message de test autorisé et réception de l'email ; aucun message envoyé ici.
5. Contrôler les variables Netlify existantes et le DNS, uniquement si l'utilisateur autorise explicitement cette étape.
6. Vérifier les balises GTM + GA4 (éviter les vues doublées) et la conformité cookies, puis comparer les vues dans GA4.
7. Valider les Core Web Vitals, les contrastes, Lighthouse et Google Search Console (indexation du sitemap).

## Indicateurs Analytics de départ (capture fournie)
Le rapport est bien celui de yoaz.fr selon l'utilisateur : 246 sessions Direct, 7 AI Assistant et 3 Organic Search (période affichée sur la capture). Les priorités SEO sont : indexation des nouvelles pages, impressions des requêtes hors marque, clics organiques, trafic d'images, sollicitations via contact.

**Statut : changements réels sur GitHub, pas de publication ni d'essai d'intégration live.**

## Passe de vérification complémentaire (2 novembre 2026, après la première stabilisation)

- **99 sur 99 références d'images statiques** `src` / `srcset` de l'accueil ont un fichier existant dans le dépôt (vérification GitHub de chaque chemin). Test automatique correspondant ajouté.
- **Erreur de performance supprimée :** l'ancien observateur `yoaz-user-final-correction-2026-06-30-js` observait `document.documentElement` en profondeur puis reconstruisait plusieurs cartes clients avec `innerHTML`, ce qui pouvait redéclencher son propre observateur. La boucle a été supprimée ; les initialisations ponctuelles restent.
- Le contrôleur du feed Instagram isole désormais les caches par empreinte SHA-256 de la configuration token/compte. Un test avec requêtes simulées a confirmé cache hit, renouvellement de jeton et rechargement (3 cas).
- Les 10 pages projets sont cohérentes avec le paramètre Netlify existant `pretty_urls = true` : URLs canoniques `/projets/slug/` et `/en/projects/slug/` pour éviter la duplication `.html`. Les fichiers source restent `slug.html`, sans nouveau déploiement.
- Les liens de détail sous la galerie clients utilisent `role=navigation` sur un conteneur `div` pour éviter les règles globales appliquées aux balises `nav` du site historique.
- Typographie mobile : sélecteurs rendus assez précis pour éviter qu'un ancien patch les écrase.
- Les liens internes `#shop` de la FAQ restent dans la même fenêtre en FR/EN/NL/ES.
- Un attribut `id` dupliqué a été corrigé et la vérification des IDs est intégrée aux tests.
- Les couvertures *Fortune*, *Fast Company* et les visuels Mira ont été examinés visuellement et correspondent au projet affiché malgré le nom inhabituel de certains fichiers. Ne pas les réassigner automatiquement.
- Les tests restent `node --test tests/yoaz-current.test.cjs`, sans navigateur ni API externe; leur exécution via GitHub Actions n'est pas encore confirmée ici.

**Limites :** la résolution réelle des Pretty URLs devra être contrôlée lors d'un futur déploiement autorisé, tout comme la connexion Meta/Instagram réelle, Stripe, Formspree, l'analyse de performance dans un navigateur et le consentement GA4/GTM.

## Passe de reprise — accessibilité des pages projets (2 novembre 2026)

Branche de travail **isolée** : `work/yoaz-qa-mobile-no-deploy-20261102` (créée depuis `d6ab344a571d67e337fbb9dc0bbdc7d42af97794`). Ne pas confondre avec l'ancienne refonte éditoriale abandonnée.

- `assets/css/yoaz-case-studies.css` : titres longs pouvant revenir à la ligne sur téléphone, entête qui s'adapte sous 520 px, CTA tactile ≥ 48 px, contraste plus fort sur les petits textes et navigation clavier plus visible. L'accueil, les logos et les illustrations ne sont pas modifiés.
- `tests/yoaz-case-pages.test.cjs` : QA sans accès réseau des **10 pages projets FR/EN**, balises canoniques, alternates, Open Graph, structure accessible, images, légendes et liens internes ; vérification statique des styles mobiles.
- `package.json` : `npm test` exécute maintenant les tests existants et les nouveaux tests, au lieu d'afficher « no test specified ».
- Vérification des contenus GitHub par lecture seule : **10/10 pages**, **40 figures**, **120 balises de lien** contrôlées sans incohérence sur les critères vérifiés. La syntaxe JavaScript du nouveau test a été vérifiée.
- **Non réalisé :** exécution native de `npm test` sur un checkout complet, revue visuelle Chrome/Safari/iPhone, vérification Instagram Meta/Stripe/Formspree réelle, Lighthouse et validation des DNS/Pretty URLs.
- **Aucune PR, fusion, suppression d'œuvre, commande Netlify ou déploiement volontaire** dans cette passe. La production et `main` ne sont pas modifiées.
