# YOAZ — contrôle Analytics sans publication (2 novembre 2026)

## Constat dans le code `index.html`
- Google Tag Manager est chargé via le conteneur `GTM-WLJNC5JN` (script dans le `head` et variante `noscript`).
- La même page charge directement `gtag.js?id=G-5LMJ4WPF9L` et exécute `gtag('config','G-5LMJ4WPF9L',{'send_page_view':true})`.
- Ces deux systèmes présents dans l'accueil **ne prouvent pas à eux seuls** un double `page_view` : l'état réel dépend des balises activées à l'intérieur du conteneur GTM, qui n'a pas été consulté.
- Aucun gestionnaire de consentement clairement identifiable n'a été trouvé dans les scripts de l'accueil analysés. Une configuration distante ou intégrée dans GTM reste possible et n'a pas été vérifiée.

## Prochaine vérification manuelle, sans modifier la production
1. Ouvrir le conteneur GTM et vérifier si une balise Google tag / GA4 pour `G-5LMJ4WPF9L` se déclenche sur l'ensemble des pages.
2. Avec Tag Assistant et DebugView, vérifier si **une seule page_view** est collectée par vrai chargement de page, en préservant les données existantes.
3. Contrôler la gestion du consentement et le comportement avant/après le choix d'un visiteur, notamment sur les navigateurs européens.
4. Vérifier que la propriété GA4 consultée est bien celle de `yoaz.fr` et non un autre site ou marchand.
5. Après validation, désigner un seul mécanisme responsable des événements et documenter la migration. Ne pas supprimer `gtag.js` ou modifier GTM sur une simple supposition.
6. Comparer ensuite les rapports de sessions (direct, recherche organique, IA), impressions et clics Google Search Console après publication autorisée des pages projets.

## Périmètre et sécurité
Ce document est un **inventaire statique**, pas une vérification du GTM distant, des appels réseau du navigateur, du consentement réel, ni de la propriété Analytics. Aucun accès au compte GTM, aucune collecte d'identifiants, aucun déploiement Netlify, aucun changement de données GA4 et aucune fusion dans `main`.
