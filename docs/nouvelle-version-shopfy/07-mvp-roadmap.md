# Roadmap MVP et modules prioritaires

## MVP cible

Le MVP doit prouver le coeur de la nouvelle version Shopfy:

1. un fournisseur publie des produits;
2. un vendeur cree sa boutique;
3. le vendeur importe un produit fournisseur;
4. le client commande dans la boutique;
5. le vendeur peut connecter un moyen de paiement;
6. l'admin supervise fournisseurs et boutiques.

## Phase 0 - Fondations

Livrables:

- monorepo propre;
- design system minimal;
- schema PostgreSQL propre;
- migrations;
- authentification;
- roles et permissions;
- environnement staging.

Definition of done:

- inscription et connexion fonctionnent;
- un user peut posseder une boutique ou un fournisseur;
- tests de permissions sur endpoints tenant.

## Phase 1 - Fournisseurs B2B

Livrables:

- creation profil fournisseur;
- dashboard fournisseur;
- CRUD produits fournisseurs;
- pages `/suppliers` et `/supplier/[slug]`;
- validation admin fournisseur.

Definition of done:

- un fournisseur actif est visible publiquement;
- ses produits affichent prix de gros et MOQ;
- admin peut valider/suspendre.

## Phase 2 - Boutiques vendeurs

Livrables:

- creation boutique;
- URL `/store/[slug]`;
- settings logo, banniere, couleur, devise;
- CRUD produits boutique;
- page boutique publique.

Definition of done:

- un vendeur peut creer une boutique en moins de 3 minutes;
- il peut ajouter un produit et voir sa boutique publique.

## Phase 3 - Import produit fournisseur

Livrables:

- bouton `Ajouter a ma boutique`;
- copie produit + images + variantes;
- `product_imports`;
- edition du produit importe;
- liste produits importes dans dashboard.

Definition of done:

- un vendeur importe un produit fournisseur en 1 clic;
- le produit importe devient editable et vendable dans sa boutique;
- le lien source fournisseur reste conserve.

## Phase 4 - Panier, commandes et clients

Livrables:

- panier boutique;
- checkout sans paiement live au debut;
- creation commande;
- emails confirmation;
- dashboard commandes;
- clients et adresses.

Definition of done:

- un client peut commander dans une boutique;
- le vendeur voit la commande;
- le client recoit une confirmation.

## Phase 5 - Paiements

Livrables:

- onboarding Stripe Connect;
- checkout Stripe sandbox;
- webhooks Stripe;
- onboarding PayPal sandbox;
- checkout PayPal sandbox;
- paiements manuels.

Definition of done:

- une commande sandbox Stripe passe a `paid` via webhook;
- une commande sandbox PayPal passe a `paid` via capture/webhook;
- les fonds sont routes vers le compte vendeur configure.

## Phase 6 - Business model

Livrables:

- plans Free, Pro, Business, Enterprise;
- limites par plan;
- Stripe Billing pour abonnement Shopfy;
- commissions optionnelles;
- options premium: badge verifie, mise en avant.

Definition of done:

- admin peut assigner un plan;
- un vendeur peut payer un plan;
- la plateforme calcule les commissions.

## Phase 7 - Admin et securite

Livrables:

- Super Admin;
- moderation fournisseurs/boutiques;
- signalements;
- audit logs;
- 2FA admin;
- anti-spam messages;
- rate limiting API.

Definition of done:

- admin controle les entites critiques;
- actions sensibles journalisees;
- endpoints proteges contre abus basiques.

## Modules prioritaires

Priorite 1:

- auth;
- schema DB;
- suppliers;
- stores;
- product import;
- admin validation.

Priorite 2:

- cart;
- orders;
- Stripe Connect;
- PayPal Business;
- dashboard vendeur.

Priorite 3:

- abonnements;
- commissions;
- SEO boutique;
- marketing;
- reviews;
- messages avances.

## KPI MVP

- nombre de fournisseurs actifs;
- nombre de boutiques creees;
- nombre de produits importes;
- taux import vers publication;
- commandes creees;
- boutiques avec paiement connecte;
- revenus abonnement;
- revenus options premium.
