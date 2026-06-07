# Nouvelle version Shopfy - Blueprint de reconstruction

La nouvelle version Shopfy devient une plateforme hybride:

- marketplace B2B de fournisseurs et grossistes;
- creation de boutiques vendeurs sous `shopfy.site/store/[slug]`;
- sourcing et importation de produits fournisseurs;
- commandes, clients et paiements directs vendeur;
- revenus Shopfy via abonnements, options premium et commissions optionnelles.

Ce dossier ne prolonge pas l'ancienne architecture. Il definit la nouvelle base produit et technique a construire.

## Documents

1. [Architecture cible](./01-target-architecture.md)
2. [Schema SQL](./02-database-schema.sql)
3. [Roles et workflows](./03-roles-workflows.md)
4. [API principales](./04-api-contract.md)
5. [Stripe Connect et PayPal Business](./05-payments-stripe-paypal.md)
6. [Plan de migration](./06-migration-plan.md)
7. [Roadmap MVP et modules prioritaires](./07-mvp-roadmap.md)
8. [Checklist securite et deploiement MVP](./08-security-deployment-checklist.md)

## Principe directeur

Shopfy doit devenir:

> La plateforme ou les vendeurs trouvent leurs fournisseurs et creent leur boutique au meme endroit.

Le coeur strategique est l'import de produits:

1. un fournisseur publie un produit B2B;
2. un vendeur clique sur `Ajouter a ma boutique`;
3. Shopfy copie le produit dans la boutique du vendeur;
4. le vendeur adapte le prix, les photos et la description;
5. le client final achete sur la boutique du vendeur.

## URLs cibles

| Surface | URL |
| --- | --- |
| Accueil | `/` |
| Fournisseurs | `/suppliers` |
| Profil fournisseur | `/supplier/[slug]` |
| Boutiques | `/stores` |
| Boutique vendeur | `/store/[slug]` |
| Produit public | `/product/[slug]` |
| Dashboard | `/dashboard` |
| Admin | `/admin` |
