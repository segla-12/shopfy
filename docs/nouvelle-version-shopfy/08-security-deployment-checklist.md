# Checklist securite et deploiement MVP

Cette checklist transforme le MVP Shopfy en version deployable avec Supabase Auth et RLS.

## 1. Base de donnees Supabase

Executer `supabase-shopfy-mvp-stores.sql` dans Supabase SQL Editor.

Le script cree:

- `shopfy_stores`;
- `shopfy_store_products`;
- `shopfy_store_orders`;
- `shopfy_store_order_items`;
- `owner_user_id` lie a `auth.users`;
- lectures publiques des boutiques et produits;
- ecritures reservees au vendeur connecte proprietaire de la boutique.

## 2. Authentification

Dans Supabase Authentication:

- activer Email + Password;
- activer Google si la connexion Gmail est utilisee;
- configurer les redirect URLs du domaine de deploiement;
- verifier que les emails de recuperation utilisent bien `{{ .RedirectTo }}` dans le bouton/lien si un template personnalise est actif.

URLs a autoriser:

- Site URL: `https://shopfy.site`;
- `http://127.0.0.1:3000/auth/callback`;
- `http://127.0.0.1:3000/auth/confirm`;
- `http://localhost:3000/auth/callback`;
- `http://localhost:3000/auth/confirm`;
- `https://shopfy.site/auth/callback`;
- `https://shopfy.site/auth/confirm`;
- `https://*-romho.vercel.app/**` ou le domaine de preview Vercel reel si utilise.

Dans Google Cloud OAuth:

- Authorized JavaScript origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `https://shopfy.site`;
- Authorized redirect URIs: l'URL callback Supabase du projet, au format `https://<project-ref>.supabase.co/auth/v1/callback`;
- copier le Client ID et le Client Secret dans Supabase > Authentication > Providers > Google.

## 3. Variables d'environnement

Variables requises:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_SECRET=
```

Variable serveur requise pour les commandes en attente creees depuis le panier WhatsApp:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` cote client.

## 4. Regles securisees

Le comportement attendu est:

- un visiteur peut voir `/stores` et `/store/[slug]`;
- un vendeur doit se connecter sur `/auth`;
- un vendeur peut demander un lien de mot de passe oublie depuis `/auth`;
- un vendeur revient par `/auth/callback`, puis definit un nouveau mot de passe sur `/auth?reset=1`;
- un vendeur connecte peut creer sa boutique sur `/create-store`;
- un vendeur connecte peut importer un produit depuis `/sourcing`;
- un vendeur ne peut modifier que les produits de sa propre boutique;
- un visiteur peut creer une commande en attente depuis le panier WhatsApp;
- une commande en attente ne devient une vente realisee qu'apres confirmation par le vendeur dans `/dashboard`;
- `/api/stores?mine=true` renvoie `401` sans session.

## 5. Verification avant mise en ligne

Commandes locales:

```bash
npm run lint
npm run build
```

Tests navigateur:

1. ouvrir `/auth`;
2. creer ou connecter un compte vendeur;
3. tester `Mot de passe oublie ?` avec l'email du vendeur;
4. ouvrir le lien recu par email et definir un nouveau mot de passe;
5. ouvrir `/create-store`;
6. creer une boutique;
7. ouvrir `/sourcing`;
8. importer un produit;
9. ouvrir `/dashboard`;
10. verifier que le produit importe apparait;
11. ouvrir la boutique publique `/store/[slug]`;
12. ajouter un produit au panier et cliquer `Commander sur WhatsApp`;
13. verifier dans `/dashboard` que la commande apparait en attente;
14. confirmer la commande et verifier que les ventes realisees augmentent;
15. ouvrir `/stores`.

Test API attendu sans connexion:

```bash
GET /api/stores?mine=true
```

Resultat attendu:

```json
{ "stores": [], "message": "Authentication required." }
```

avec statut `401`.
