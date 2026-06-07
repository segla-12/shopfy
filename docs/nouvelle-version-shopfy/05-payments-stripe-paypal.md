# Paiements Nouvelle version Shopfy - Stripe Connect et PayPal Business

## Objectif

Le client paie sur la boutique du vendeur. Les fonds sont traites par Stripe ou PayPal et routes vers le vendeur. Shopfy ne stocke jamais les cartes bancaires et ne cree pas de wallet marchand interne.

## Stripe Connect

### Choix recommande

Pour Nouvelle version Shopfy:

- utiliser Stripe Connect pour relier chaque boutique a un compte marchand;
- stocker `stripe_account_id` dans `payment_accounts`;
- utiliser Stripe Checkout ou Payment Element pour carte, Apple Pay et Google Pay;
- collecter une commission Shopfy via application fee si le plan le permet.

### Onboarding vendeur

1. Le vendeur clique `Connecter Stripe`.
2. Backend:
   - cree ou retrouve le compte connecte;
   - genere un Account Link;
   - renvoie l'URL au vendeur.
3. Le vendeur complete l'onboarding Stripe.
4. Stripe renvoie vers `return_url`.
5. Shopfy verifie l'etat du compte via API et webhooks.
6. Paiements actives seulement si `charges_enabled` et `payouts_enabled`.

### Checkout

Flux recommande:

1. creer une commande `pending`;
2. creer une session Stripe Checkout ou un PaymentIntent connecte au compte vendeur;
3. inclure la commission Shopfy si configuree;
4. attendre le webhook Stripe pour passer la commande a `paid`;
5. enregistrer `payments` et `transactions`.

### Webhooks Stripe

Evenements minimum:

- `account.updated`;
- `checkout.session.completed`;
- `payment_intent.succeeded`;
- `payment_intent.payment_failed`;
- `charge.refunded`;
- `charge.dispute.created`;
- `invoice.paid`;
- `customer.subscription.updated`;
- `customer.subscription.deleted`.

### Donnees a stocker

```txt
payment_accounts.provider = stripe
payment_accounts.provider_account_id = acct_...
payment_accounts.charges_enabled
payment_accounts.payouts_enabled
payment_accounts.details_submitted
payments.provider_payment_id
transactions.provider_transaction_id
```

## PayPal Business

### Choix recommande

Utiliser PayPal Complete Payments Platform / Multiparty pour onboarder les vendeurs et permettre des paiements vers leurs comptes PayPal.

Important: la production PayPal multiparty necessite generalement une validation partenaire PayPal. Le sandbox peut etre utilise pour developper et tester.

### Onboarding vendeur

1. Le vendeur clique `Connecter PayPal`.
2. Backend genere un lien via Partner Referrals API.
3. PayPal redirige le vendeur vers login/signup.
4. Le vendeur donne les permissions.
5. PayPal renvoie vers Shopfy.
6. Shopfy verifie l'integration marchand.
7. La boutique active PayPal seulement si le compte est valide.

### Checkout PayPal

1. creer commande Shopfy `pending`;
2. creer une PayPal Order avec `purchase_units.payee`;
3. definir `platform_fees` si commission active;
4. rediriger le client vers l'URL d'approbation;
5. capturer l'ordre apres approbation;
6. confirmer via webhook et enregistrer la transaction.

### Webhooks PayPal

Evenements minimum:

- seller onboarding completed/permission revoked;
- checkout order approved/captured;
- payment capture completed/denied/refunded;
- dispute created/updated.

## Paiements manuels

Chaque boutique peut activer:

- virement bancaire;
- paiement a la livraison;
- instruction personnalisee.

Regles:

- commande creee en `pending`;
- vendeur confirme manuellement le paiement;
- audit log obligatoire;
- aucune commission automatique sauf si Shopfy decide de facturer hors paiement.

## Commissions Shopfy

Deux modes:

- abonnement mensuel;
- commission optionnelle par transaction.

Structure:

```txt
platform_fee = fixed_fee + (order_total * percentage_fee)
```

La commission doit etre calculee avant checkout et stockee dans `payments.platform_fee_amount`.

## References officielles

- Stripe Connect destination charges: https://docs.stripe.com/connect/destination-charges
- Stripe Connect onboarding: https://docs.stripe.com/connect/connect-onboarding
- PayPal seller onboarding: https://developer.paypal.com/docs/multiparty/seller-onboarding/
- PayPal multi-seller payments: https://developer.paypal.com/docs/multiparty/checkout/multiseller-payments/

