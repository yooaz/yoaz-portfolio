# YOAZ Release 2.1 — Social / Instagram / Stripe prep

Corrections appliquées :

- Foundation supprimé des liens sociaux visibles, du footer social et des données `sameAs` principales.
- Réseaux sociaux dédoublés : rendu unique desktop + mobile, sans superposition.
- Icônes sociales stabilisées : Instagram, Behance, Dribbble, LinkedIn, Vimeo, Linktree.
- Feed Instagram sécurisé : fallback local visible avec 9 œuvres si le feed/API Instagram ne charge pas.
- Stripe préparé : les boutons posters sont reliés à une configuration `YOAZ_STRIPE_PAYMENT_LINKS`. Tant que les Payment Links ne sont pas renseignés, le clic renvoie vers Contact avec un message clair.
- Fichier exemple ajouté : `stripe-payment-links.example.json`.

À faire pour activer Stripe en live :

1. Créer les Payment Links dans Stripe pour chaque poster.
2. Remplacer les URLs vides dans `window.YOAZ_STRIPE_PAYMENT_LINKS` dans `index.html` ou injecter le même objet via un petit fichier JS.
3. Tester en mode Stripe test.
4. Remplacer par les liens live.

Note Instagram : sans token/API Meta valide, le site ne peut pas récupérer automatiquement les derniers posts. Le fallback local garantit que la section n’est jamais vide.
