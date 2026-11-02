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
