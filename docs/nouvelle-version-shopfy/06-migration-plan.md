# Plan de migration depuis l'existant

## Position

L'ancienne application sert seulement de reference metier:

- fournisseurs;
- produits;
- prix;
- MOQ;
- contacts;
- langues;
- avertissement commande;
- logique marketplace grossiste.

Elle ne doit pas imposer la nouvelle architecture.

## Strategie

### Phase 1 - Gel de l'ancien produit

- ne plus ajouter de grosses fonctionnalites a l'architecture actuelle;
- corriger seulement les bugs critiques;
- documenter les routes existantes et tables actuelles;
- exporter les donnees utiles.

### Phase 2 - Nouveau schema en parallele

- creer les tables de la nouvelle version dans un nouvel espace/schema;
- conserver les donnees existantes intactes;
- ecrire des scripts d'import;
- generer les nouveaux slugs fournisseurs et produits.

### Phase 3 - Mapping donnees

| Ancien concept | Nouveau concept |
| --- | --- |
| vendeur/fournisseur telephone | `suppliers` + `supplier_members` |
| produit catalogue | `products` + `supplier_products` |
| images produit | `product_images` |
| categorie texte | `categories` |
| page vendeur ancienne | `/supplier/[slug]` |
| bouton commande WhatsApp | demande/contact fournisseur ou commande boutique |

### Phase 4 - Migration fournisseurs

1. grouper les anciens produits par fournisseur;
2. creer un `supplier` par fournisseur;
3. creer les `supplier_products`;
4. migrer images, prix, MOQ, ville, pays, contact;
5. marquer les fournisseurs `pending_review` ou `active` selon qualite des donnees.

### Phase 5 - Lancement boutiques vendeurs

- ne pas migrer automatiquement tous les fournisseurs vers boutiques;
- chaque utilisateur cree volontairement sa boutique;
- proposer aux fournisseurs existants de creer aussi une boutique vendeur.

### Phase 6 - Redirections

| Ancienne route | Nouvelle route |
| --- | --- |
| `/seller/[phone]` | `/supplier/[slug]` |
| `/product/[id]` | `/product/[slug]` |
| `/sell` | `/dashboard/supplier/products/new` ou `/dashboard/store/products/new` |
| `/manage` | `/dashboard` |
| `/admin` | `/admin` nouvelle version |

### Phase 7 - Cutover

1. mettre la nouvelle version Shopfy en staging;
2. importer donnees;
3. tester fournisseurs, boutiques, import produit, checkout sandbox;
4. lancer la nouvelle version Shopfy en production;
5. garder les redirections;
6. archiver l'ancienne base apres verification.

## Risques

- donnees fournisseurs incompletes;
- slugs dupliques;
- anciennes images externes indisponibles;
- contacts non verifies;
- categories trop libres;
- paiements non connectes au lancement.

## Mesures

- validation admin avant publication;
- normalisation categories;
- verification emails et telephones;
- logs d'import;
- rollback possible via sauvegarde de l'ancien site.
