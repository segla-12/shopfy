# API principales Nouvelle version Shopfy

Convention:

- API JSON sous `/api` pour la nouvelle version.
- Auth obligatoire sauf endpoints publics.
- Toutes les mutations acceptent un header `Idempotency-Key`.
- Tous les endpoints multi-tenant verifient membership et role.

## Auth

| Methode | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Creer un compte email/password. |
| POST | `/api/auth/login` | Connexion. |
| POST | `/api/auth/oauth/google` | OAuth Google. |
| POST | `/api/auth/oauth/facebook` | OAuth Facebook. |
| POST | `/api/auth/logout` | Deconnexion. |
| GET | `/api/me` | Profil utilisateur courant. |

## Suppliers

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/suppliers` | Liste publique fournisseurs actifs. |
| POST | `/api/suppliers` | Creer profil fournisseur. |
| GET | `/api/suppliers/:slug` | Profil public fournisseur. |
| PATCH | `/api/suppliers/:supplierId` | Modifier profil fournisseur. |
| POST | `/api/suppliers/:supplierId/submit-review` | Soumettre validation admin. |
| GET | `/api/suppliers/:supplierId/products` | Produits du fournisseur. |
| POST | `/api/suppliers/:supplierId/products` | Ajouter produit fournisseur. |
| PATCH | `/api/supplier-products/:productId` | Modifier produit fournisseur. |
| DELETE | `/api/supplier-products/:productId` | Archiver produit fournisseur. |

## Stores

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/stores` | Liste publique boutiques actives. |
| POST | `/api/stores` | Creer boutique vendeur. |
| GET | `/api/stores/:slug` | Boutique publique. |
| PATCH | `/api/stores/:storeId` | Modifier boutique. |
| PATCH | `/api/stores/:storeId/settings` | Theme, SEO, contact, checkout. |
| POST | `/api/stores/:storeId/publish` | Publier boutique. |
| POST | `/api/stores/:storeId/suspend` | Suspendre boutique, admin seulement. |

## Store products

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/stores/:storeId/products` | Produits boutique. |
| POST | `/api/stores/:storeId/products` | Ajouter produit propre. |
| POST | `/api/stores/:storeId/imports` | Importer produit fournisseur. |
| PATCH | `/api/store-products/:productId` | Modifier produit boutique. |
| DELETE | `/api/store-products/:productId` | Archiver produit boutique. |

### Payload import produit

```json
{
  "supplierProductId": "uuid",
  "retailPrice": 49.99,
  "currency": "USD",
  "publishNow": false
}
```

### Reponse import produit

```json
{
  "storeProductId": "uuid",
  "sourceSupplierProductId": "uuid",
  "status": "draft"
}
```

## Cart and checkout

| Methode | Route | Description |
| --- | --- | --- |
| POST | `/api/stores/:storeId/cart` | Creer panier. |
| PATCH | `/api/carts/:cartId/items` | Ajouter/modifier ligne panier. |
| POST | `/api/carts/:cartId/checkout` | Creer commande et session paiement. |
| POST | `/api/orders/:orderId/cancel` | Annuler commande si autorise. |

## Orders

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/stores/:storeId/orders` | Liste commandes vendeur. |
| GET | `/api/orders/:orderId` | Detail commande. |
| PATCH | `/api/orders/:orderId/status` | Changer statut. |
| POST | `/api/orders/:orderId/refund` | Remboursement via provider si possible. |

## Payments

| Methode | Route | Description |
| --- | --- | --- |
| POST | `/api/stores/:storeId/payments/stripe/connect` | Creer ou reprendre onboarding Stripe. |
| GET | `/api/stores/:storeId/payments/stripe/status` | Etat compte Stripe connecte. |
| POST | `/api/stores/:storeId/payments/paypal/connect` | Generer lien onboarding PayPal. |
| GET | `/api/stores/:storeId/payments/paypal/status` | Etat compte PayPal. |
| POST | `/api/webhooks/stripe` | Webhook Stripe. |
| POST | `/api/webhooks/paypal` | Webhook PayPal. |

## Dashboard

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/dashboard/store/:storeId/overview` | CA, commandes, clients, conversion. |
| GET | `/api/dashboard/supplier/:supplierId/overview` | Vues, imports, messages, produits. |
| GET | `/api/dashboard/store/:storeId/imports` | Produits importes et sources. |

## Admin

| Methode | Route | Description |
| --- | --- | --- |
| GET | `/api/admin/users` | Gestion utilisateurs. |
| GET | `/api/admin/suppliers` | Fournisseurs, filtres par statut. |
| POST | `/api/admin/suppliers/:supplierId/approve` | Valider fournisseur. |
| POST | `/api/admin/suppliers/:supplierId/reject` | Rejeter fournisseur. |
| GET | `/api/admin/stores` | Boutiques. |
| POST | `/api/admin/stores/:storeId/suspend` | Suspendre boutique. |
| GET | `/api/admin/reports` | Signalements. |
| GET | `/api/admin/metrics` | Statistiques globales. |

## Webhook rules

- verifier signature provider;
- enregistrer le payload brut;
- traiter de facon idempotente;
- ne jamais faire confiance au statut envoye par le client navigateur;
- rattacher l'evenement a `store_id`, `order_id` ou `subscription_id`;
- produire un `audit_log`.

