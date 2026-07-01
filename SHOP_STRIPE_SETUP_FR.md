# YOAZ Shop — Stripe + Gelato manuel

Le site est prêt pour un workflow simple :

1. Le client choisit un poster.
2. Stripe Checkout encaisse 59 € avec livraison incluse.
3. Stripe collecte email, téléphone, adresse de facturation et adresse de livraison.
4. Tu vois la commande dans Stripe avec le produit, l’adresse, le paiement et les signaux Radar.
5. Tu commandes manuellement le poster sur Gelato.
6. En cas de doute, tu peux rembourser depuis Stripe avant d’envoyer la commande Gelato.

## Netlify

Dans Netlify > Site configuration > Environment variables :

```env
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY_ICI
```

Puis redeploy.

## Anti-scam

Stripe Radar analyse automatiquement les paiements et donne des signaux de risque. La fonction ajoute aussi dans les metadata :

- produit commandé
- format 50x70
- IP approximative reçue par Netlify
- user-agent

Pour vérifier une commande : Stripe Dashboard > Payments > ouvrir le paiement > regarder Risk evaluation / Radar, billing address, shipping address, email et téléphone.

## Remboursement

Si la commande semble risquée, rembourse depuis Stripe avant de commander sur Gelato.


## V3.1 — Option lien Stripe unique

Pour lancer vite avec un seul prix pour tous les posters:

1. Crée un Payment Link Stripe à 59 €.
2. Dans Netlify, va dans Site configuration → Environment variables.
3. Ajoute:

```text
STRIPE_UNIVERSAL_PAYMENT_LINK=https://buy.stripe.com/TON_LIEN
```

Tous les boutons Acheter utiliseront ce lien.

## Option Checkout backend

Si tu préfères utiliser la fonction Netlify `create-checkout`, ajoute:

```text
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY_ICI
```

Le backend facture maintenant 59 € pour chaque poster.
