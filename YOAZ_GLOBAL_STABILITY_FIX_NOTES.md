# YOAZ — Global Stability Fix 2026-07-09

Corrections appliquées sans changer le design global :

- Stabilisation du texte hero `Illustrations géométriques & psychédéliques` : suppression des animations/transitions sur ce texte et blocage de la mise en ligne instable.
- Stabilisation ciblée des cartes Travaux Clients qui scintillaient : Fortune / Elon Musk, Fortune / Jeff Bezos, Fast Company, Kraken, Mira.
- Passage des images critiques en chargement eager/sync pour éviter le flash noir / lazy-load au scroll.
- Conservation du hero, du shop, des logos et de la modale actuelle.
- Aucun renommage d’assets et aucune suppression d’images.

Recommandation pour une prochaine vraie version propre : consolider les nombreux blocs CSS/JS historiques dans une seule source de données `PJ_DATA`, puis supprimer les scripts qui réécrivent le DOM avec `setTimeout`.
