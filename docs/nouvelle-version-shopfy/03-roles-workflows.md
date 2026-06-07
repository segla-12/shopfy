# Roles utilisateurs et workflows Nouvelle version Shopfy

## Roles globaux

| Role | Description |
| --- | --- |
| Visitor | Utilisateur non connecte qui visite fournisseurs, boutiques et produits. |
| Customer | Client final qui commande dans une boutique. |
| Seller Owner | Proprietaire d'une boutique vendeur. |
| Seller Staff | Collaborateur d'une boutique. |
| Supplier Owner | Proprietaire d'un profil fournisseur/grossiste. |
| Supplier Staff | Collaborateur fournisseur. |
| Support Admin | Support Shopfy avec acces limite. |
| Finance Admin | Gestion abonnements, commissions, paiements. |
| Super Admin | Controle total de la plateforme. |

## Permissions principales

| Action | Seller | Supplier | Admin |
| --- | --- | --- | --- |
| Creer une boutique | Oui | Oui, si compte vendeur active | Oui |
| Creer un profil fournisseur | Oui | Oui | Oui |
| Ajouter produit fournisseur | Non | Oui | Oui |
| Ajouter produit boutique | Oui | Non | Oui |
| Importer produit fournisseur | Oui | Non | Oui |
| Gerer commandes boutique | Oui | Non | Oui |
| Voir demandes fournisseur | Non | Oui | Oui |
| Valider fournisseur | Non | Non | Oui |
| Suspendre boutique | Non | Non | Oui |
| Gerer commissions | Non | Non | Oui |

## Workflow 1 - Fournisseur

1. Le fournisseur cree un compte.
2. Il choisit `Creer un profil fournisseur`.
3. Il renseigne entreprise, pays, ville, logo, banniere, contact.
4. Il ajoute des produits B2B: prix de gros, MOQ, images, variantes.
5. Le profil passe en `pending_review`.
6. Le Super Admin valide ou rejette.
7. Le fournisseur devient visible sur `/suppliers` et `/supplier/[slug]`.
8. Les vendeurs peuvent contacter le fournisseur ou importer ses produits.

## Workflow 2 - Vendeur avec boutique

1. Le vendeur cree un compte.
2. Shopfy propose de creer une boutique.
3. Il choisit le nom et obtient `shopfy.site/store/[slug]`.
4. Il ajoute logo, banniere, devise et pays.
5. Il connecte Stripe Connect ou PayPal Business.
6. Il ajoute ses produits ou importe ceux des fournisseurs.
7. Il partage son lien boutique.
8. Les clients commandent et paient.
9. Les fonds sont routes vers le compte de paiement du vendeur.

## Workflow 3 - Import de produit fournisseur

1. Le vendeur visite un produit fournisseur.
2. Il clique `Ajouter a ma boutique`.
3. Si le vendeur n'a pas de boutique, Shopfy l'envoie vers la creation boutique.
4. Shopfy copie:
   - titre;
   - description;
   - images;
   - variantes;
   - categorie;
   - caracteristiques;
   - reference source fournisseur.
5. Shopfy cree un `store_product` independant.
6. Le vendeur modifie le prix de vente, la description et les images.
7. Le produit devient publiable dans sa boutique.

Regle importante: apres import, le produit boutique est une copie editable. Le lien source reste conserve pour le sourcing et les statistiques.

## Workflow 4 - Commande client final

1. Le client visite `/store/[slug]`.
2. Il ajoute un produit au panier.
3. Il renseigne email, adresse et methode de livraison.
4. Il choisit Stripe, PayPal ou paiement manuel si active.
5. Shopfy cree une commande `pending`.
6. Le prestataire paiement confirme via webhook.
7. Shopfy passe la commande a `paid`.
8. Le vendeur recoit une notification.
9. Le client recoit une confirmation.

## Workflow 5 - Administration

1. L'admin voit les fournisseurs et boutiques en attente.
2. Il valide, rejette ou suspend.
3. Il gere categories, signalements et utilisateurs.
4. Il controle les plans, options premium et commissions.
5. Il suit les statistiques globales:
   - GMV;
   - nombre de boutiques;
   - nombre de fournisseurs;
   - produits importes;
   - commandes;
   - revenus Shopfy.

