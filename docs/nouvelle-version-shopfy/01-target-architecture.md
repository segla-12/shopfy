# Architecture cible Nouvelle version Shopfy

## Objectif

Reconstruire Shopfy comme une plateforme SaaS internationale capable de supporter:

- des milliers de fournisseurs;
- des milliers de boutiques vendeurs;
- des catalogues produits volumineux;
- des commandes multi-devises;
- des paiements directs via Stripe Connect et PayPal Business;
- une administration centrale.

## Stack recommandee

### Monorepo

```txt
apps/
  web/                  # Next.js: site public, boutiques, dashboards
  api/                  # API backend modulaire: REST/JSON ou tRPC interne
  worker/               # jobs async: emails, imports, webhooks, sync search

packages/
  db/                   # schema, migrations, client ORM
  domain/               # regles metier: stores, suppliers, orders
  payments/             # Stripe, PayPal, commissions
  auth/                 # sessions, OAuth, permissions
  ui/                   # design system partage
  config/               # env, feature flags, countries, currencies
```

### Runtime

- Frontend: Next.js App Router.
- Backend: API Node.js modulaire, idealement NestJS ou Fastify.
- Base: PostgreSQL.
- ORM: Prisma ou Drizzle.
- Cache et sessions courtes: Redis.
- Jobs: BullMQ, Trigger.dev ou queue equivalente.
- Stockage images: S3 compatible ou Supabase Storage.
- Recherche: Meilisearch au MVP, OpenSearch ensuite si volume eleve.
- Emails: Resend, Postmark ou SendGrid.
- Observabilite: Sentry, OpenTelemetry, logs structures.

## Modules principaux

### 1. Identity and Access

- inscription email/password;
- OAuth Google et Facebook;
- sessions securisees;
- roles par espace: supplier, store, admin;
- 2FA pour admins et vendeurs avances.

### 2. Supplier Marketplace

- creation profil fournisseur;
- validation admin;
- produits B2B avec MOQ, prix de gros, variantes, images;
- messages et demandes de vendeurs;
- badge fournisseur verifie.

### 3. Store Builder

- creation automatique d'une boutique;
- URL publique `shopfy.site/store/[slug]`;
- logo, banniere, theme, couleurs, pages;
- catalogue boutique;
- panier et checkout.

### 4. Product Sourcing

- bouton `Ajouter a ma boutique` sur les produits fournisseurs;
- copie controlee des donnees produit;
- lien de tracabilite vers le fournisseur source;
- edition libre cote vendeur.

### 5. Orders and Customers

- panier;
- creation commande;
- statuts de commande;
- historique client;
- adresses;
- notifications email;
- facture simple au MVP.

### 6. Payments

- Stripe Connect pour carte, Apple Pay, Google Pay et multi-devises;
- PayPal Business via onboarding vendeur;
- paiements manuels: virement, paiement a la livraison;
- commissions optionnelles;
- aucune conservation de fonds marchand par Shopfy.

### 7. Billing Shopfy

- plans Gratuit, Pro, Business, Enterprise;
- abonnements mensuels via Stripe Billing;
- options premium: mise en avant, badge verifie, marketing avance;
- limites par plan.

### 8. Super Admin

- utilisateurs;
- fournisseurs;
- boutiques;
- categories;
- signalements;
- abonnements;
- commissions;
- statistiques globales.

## Isolation multi-tenant

Chaque ressource doit appartenir explicitement a un tenant:

- `supplier_id` pour les espaces fournisseurs;
- `store_id` pour les boutiques vendeurs;
- `user_id` pour les ressources personnelles;
- tables de membership pour autoriser l'acces.

Regles:

- aucun endpoint ne doit lire une ressource sans verifier le membership;
- toutes les requetes doivent filtrer par tenant;
- tous les webhooks de paiement doivent etre rattaches a un store ou une subscription Shopfy;
- les imports de produits doivent creer une copie independante dans la boutique.

## Internationalisation

MVP:

- anglais par defaut;
- francais choisi manuellement par l'utilisateur;
- devises principales: USD, EUR, GBP, CAD.

Post-MVP:

- allemand, espagnol, italien, neerlandais;
- TVA/VAT par pays;
- domaines personnalises.

## Environnements

```txt
local      # developpement
preview    # branches de test
staging    # donnees proches production, sandbox Stripe/PayPal
production # live
```

## Regles d'architecture

- ancienne implementation = reference metier seulement;
- nouveau schema de base de donnees;
- nouvelles API;
- nouveaux dashboards;
- separation claire public, vendeur, fournisseur, admin;
- tous les paiements critiques passent par webhooks;
- chaque action sensible est journalisee.
