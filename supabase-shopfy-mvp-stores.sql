-- Shopfy MVP stores persistence
-- Run this file in Supabase SQL Editor before testing store creation/imports.

create extension if not exists pgcrypto;

create table if not exists public.shopfy_stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  logo_url text not null default '',
  banner_url text not null default '',
  owner_name text not null default '',
  city text not null default '',
  country text not null default 'Benin',
  currency text not null default 'XOF',
  whatsapp_phone text not null default '',
  is_certified boolean not null default false,
  certification_started_at timestamptz,
  certification_expires_at timestamptz,
  certification_duration_months integer,
  certification_amount integer,
  primary_color text not null default '#111827',
  accent_color text not null default '#f97316',
  orders_count integer not null default 0,
  revenue_amount numeric(12, 2) not null default 0,
  conversion_rate numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopfy_store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shopfy_stores(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null default 'General',
  image_url text not null default '',
  price numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2),
  currency text not null default 'XOF',
  inventory_quantity integer not null default 0,
  source_supplier_name text,
  source_supplier_slug text,
  source_product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.shopfy_store_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shopfy_stores(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled')),
  payment_provider text not null default 'manual',
  payment_reference text,
  provider_transaction_id text,
  payment_url text,
  payment_requested_at timestamptz,
  paid_at timestamptz,
  payment_error text,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text not null default '',
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'XOF',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.shopfy_store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shopfy_store_orders(id) on delete cascade,
  product_id uuid references public.shopfy_store_products(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  currency text not null default 'XOF',
  created_at timestamptz not null default now()
);

create table if not exists public.shopfy_store_certification_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.shopfy_stores(id) on delete cascade,
  provider text not null default 'moneroo',
  provider_payment_id text,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount integer not null,
  currency text not null default 'XOF',
  duration_months integer not null default 1,
  checkout_url text,
  paid_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shopfy_store_products_store_id
  on public.shopfy_store_products(store_id);

create index if not exists idx_shopfy_store_orders_store_id
  on public.shopfy_store_orders(store_id);

create index if not exists idx_shopfy_store_orders_status
  on public.shopfy_store_orders(status);

create index if not exists idx_shopfy_store_orders_payment_status
  on public.shopfy_store_orders(payment_status);

create unique index if not exists idx_shopfy_store_orders_provider_transaction_id
  on public.shopfy_store_orders(provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists idx_shopfy_store_order_items_order_id
  on public.shopfy_store_order_items(order_id);

create index if not exists idx_shopfy_store_certification_payments_store_id
  on public.shopfy_store_certification_payments(store_id);

create index if not exists idx_shopfy_store_certification_payments_status
  on public.shopfy_store_certification_payments(status);

create unique index if not exists idx_shopfy_store_certification_payments_provider_payment_id
  on public.shopfy_store_certification_payments(provider_payment_id)
  where provider_payment_id is not null;

alter table public.shopfy_stores
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.shopfy_stores
  add column if not exists is_certified boolean not null default false,
  add column if not exists certification_started_at timestamptz,
  add column if not exists certification_expires_at timestamptz,
  add column if not exists certification_duration_months integer,
  add column if not exists certification_amount integer;

alter table public.shopfy_store_orders
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_provider text not null default 'manual',
  add column if not exists payment_reference text,
  add column if not exists provider_transaction_id text,
  add column if not exists payment_url text,
  add column if not exists payment_requested_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_error text,
  add column if not exists customer_email text not null default '';

alter table public.shopfy_store_orders
  drop constraint if exists shopfy_store_orders_payment_status_check,
  add constraint shopfy_store_orders_payment_status_check
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled'));

create index if not exists idx_shopfy_stores_owner_user_id
  on public.shopfy_stores(owner_user_id);

alter table public.shopfy_stores enable row level security;
alter table public.shopfy_store_products enable row level security;
alter table public.shopfy_store_orders enable row level security;
alter table public.shopfy_store_order_items enable row level security;
alter table public.shopfy_store_certification_payments enable row level security;

drop policy if exists "Public can read MVP stores" on public.shopfy_stores;
create policy "Public can read MVP stores"
  on public.shopfy_stores
  for select
  using (true);

drop policy if exists "Public can read MVP store products" on public.shopfy_store_products;
create policy "Public can read MVP store products"
  on public.shopfy_store_products
  for select
  using (true);

drop policy if exists "Public can create MVP stores" on public.shopfy_stores;
drop policy if exists "Public can update MVP stores" on public.shopfy_stores;
drop policy if exists "Public can import MVP store products" on public.shopfy_store_products;
drop policy if exists "Public can update MVP store products" on public.shopfy_store_products;
drop policy if exists "Public can delete MVP store products" on public.shopfy_store_products;

drop policy if exists "Authenticated users can create own MVP stores" on public.shopfy_stores;
create policy "Authenticated users can create own MVP stores"
  on public.shopfy_stores
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "Authenticated users can update own MVP stores" on public.shopfy_stores;
create policy "Authenticated users can update own MVP stores"
  on public.shopfy_stores
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "Store owners can import MVP store products" on public.shopfy_store_products;
create policy "Store owners can import MVP store products"
  on public.shopfy_store_products
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_products.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can update MVP store products" on public.shopfy_store_products;
create policy "Store owners can update MVP store products"
  on public.shopfy_store_products
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_products.store_id
        and stores.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_products.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can delete MVP store products" on public.shopfy_store_products;
create policy "Store owners can delete MVP store products"
  on public.shopfy_store_products
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_products.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Public can create pending MVP store orders" on public.shopfy_store_orders;
drop policy if exists "Public can create MVP store order items" on public.shopfy_store_order_items;

drop policy if exists "Store owners can read own MVP store orders" on public.shopfy_store_orders;
create policy "Store owners can read own MVP store orders"
  on public.shopfy_store_orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_orders.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can read own MVP store order items" on public.shopfy_store_order_items;
create policy "Store owners can read own MVP store order items"
  on public.shopfy_store_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_store_orders orders
      join public.shopfy_stores stores on stores.id = orders.store_id
      where orders.id = shopfy_store_order_items.order_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can update own MVP store orders" on public.shopfy_store_orders;
create policy "Store owners can update own MVP store orders"
  on public.shopfy_store_orders
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_orders.store_id
        and stores.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_orders.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Store owners can read own certification payments" on public.shopfy_store_certification_payments;
create policy "Store owners can read own certification payments"
  on public.shopfy_store_certification_payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = shopfy_store_certification_payments.store_id
        and stores.owner_user_id = auth.uid()
    )
  );

insert into public.shopfy_stores (
  slug,
  name,
  tagline,
  description,
  logo_url,
  banner_url,
  owner_name,
  city,
  country,
  currency,
  whatsapp_phone,
  orders_count,
  revenue_amount,
  conversion_rate
) values (
  'boutique-demo',
  'Boutique Demo Shopfy',
  'Boutique neutre pour tester la vente, le panier et les commandes WhatsApp.',
  'Une boutique vendeur simple avec produits varies, prix en XOF et commande possible par WhatsApp.',
  'https://images.unsplash.com/photo-1521566652839-697aa473761a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
  'Vendeur Shopfy',
  'Cotonou',
  'Benin',
  'XOF',
  '+2290149341219',
  18,
  246000,
  3.8
) on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  logo_url = excluded.logo_url,
  banner_url = excluded.banner_url,
  owner_name = excluded.owner_name,
  city = excluded.city,
  country = excluded.country,
  currency = excluded.currency,
  whatsapp_phone = excluded.whatsapp_phone,
  updated_at = now();

insert into public.shopfy_store_products (
  store_id,
  slug,
  title,
  description,
  category,
  image_url,
  price,
  compare_at_price,
  currency,
  inventory_quantity,
  source_supplier_name,
  source_supplier_slug,
  source_product_id
)
select
  stores.id,
  product.slug,
  product.title,
  product.description,
  product.category,
  product.image_url,
  product.price,
  product.compare_at_price,
  product.currency,
  product.inventory_quantity,
  product.source_supplier_name,
  product.source_supplier_slug,
  product.source_product_id
from public.shopfy_stores stores
cross join (
  values
    (
      'sac-polyvalent',
      'Sac polyvalent',
      'Sac pratique pour usage quotidien, pret pour une boutique vendeur neutre.',
      'General',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
      15000::numeric,
      19000::numeric,
      'XOF',
      24,
      'Global Apparel Supply',
      'global-apparel-supply',
      'demo-bag'
    ),
    (
      'kit-beaute-voyage',
      'Kit beaute voyage',
      'Kit compact pour revendeurs, avec accessoires essentiels et packaging simple.',
      'General',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
      12500::numeric,
      null::numeric,
      'XOF',
      31,
      'Urban Bags Wholesale',
      'urban-bags-wholesale',
      'demo-beauty-kit'
    )
) as product(
  slug,
  title,
  description,
  category,
  image_url,
  price,
  compare_at_price,
  currency,
  inventory_quantity,
  source_supplier_name,
  source_supplier_slug,
  source_product_id
)
where stores.slug = 'boutique-demo'
on conflict (store_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  image_url = excluded.image_url,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  currency = excluded.currency,
  inventory_quantity = excluded.inventory_quantity,
  source_supplier_name = excluded.source_supplier_name,
  source_supplier_slug = excluded.source_supplier_slug,
  source_product_id = excluded.source_product_id,
  updated_at = now();
