-- Nouvelle version Shopfy - PostgreSQL schema proposal
-- Goal: hybrid B2B supplier marketplace + seller store builder.

create extension if not exists pgcrypto;

create type user_status as enum ('active', 'pending', 'suspended', 'deleted');
create type membership_role as enum ('owner', 'admin', 'staff', 'viewer');
create type supplier_status as enum ('draft', 'pending_review', 'active', 'suspended', 'rejected');
create type store_status as enum ('draft', 'active', 'suspended', 'closed');
create type product_kind as enum ('supplier', 'store');
create type product_status as enum ('draft', 'active', 'archived', 'rejected');
create type cart_status as enum ('active', 'converted', 'abandoned', 'expired');
create type order_status as enum ('pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded');
create type payment_provider as enum ('stripe', 'paypal', 'manual');
create type payment_status as enum ('requires_action', 'pending', 'succeeded', 'failed', 'refunded', 'cancelled');
create type subscription_plan as enum ('free', 'pro', 'business', 'enterprise');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');
create type message_status as enum ('open', 'closed', 'spam');
create type notification_type as enum ('order', 'payment', 'message', 'system', 'admin');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  full_name text,
  avatar_url text,
  phone text,
  locale text not null default 'en',
  default_currency char(3) not null default 'USD',
  status user_status not null default 'active',
  email_verified_at timestamptz,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  slug text unique not null,
  name_en text not null,
  name_fr text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete restrict,
  slug text unique not null,
  company_name text not null,
  description text,
  logo_url text,
  banner_url text,
  country_code char(2),
  city text,
  address text,
  website_url text,
  whatsapp_phone text,
  verified_at timestamptz,
  status supplier_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplier_members (
  supplier_id uuid not null references suppliers(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role membership_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (supplier_id, user_id)
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete restrict,
  slug text unique not null,
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  country_code char(2),
  default_currency char(3) not null default 'USD',
  status store_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_members (
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role membership_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table store_settings (
  store_id uuid primary key references stores(id) on delete cascade,
  theme_key text not null default 'starter',
  primary_color text not null default '#f97316',
  font_family text not null default 'Inter',
  contact_email text,
  support_phone text,
  seo_title text,
  seo_description text,
  checkout_terms_url text,
  privacy_policy_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplier_settings (
  supplier_id uuid primary key references suppliers(id) on delete cascade,
  accepts_messages boolean not null default true,
  minimum_lead_time_days int not null default 0,
  shipping_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  kind product_kind not null,
  -- owner_id references suppliers.id when kind='supplier', stores.id when kind='store'.
  owner_id uuid not null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  status product_status not null default 'draft',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, owner_id, slug)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text,
  title text not null,
  options jsonb not null default '{}'::jsonb,
  price numeric(12,2),
  inventory_quantity int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplier_products (
  product_id uuid primary key references products(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  wholesale_price numeric(12,2),
  currency char(3) not null default 'USD',
  minimum_order_quantity int,
  lead_time_days int,
  origin_country_code char(2),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table store_products (
  product_id uuid primary key references products(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  imported_from_supplier_product_id uuid references supplier_products(product_id) on delete set null,
  retail_price numeric(12,2) not null,
  compare_at_price numeric(12,2),
  currency char(3) not null default 'USD',
  inventory_quantity int not null default 0,
  track_inventory boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table product_imports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  supplier_product_id uuid not null references supplier_products(product_id) on delete restrict,
  store_product_id uuid not null references store_products(product_id) on delete cascade,
  imported_by uuid references users(id) on delete set null,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (store_id, supplier_product_id)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, email)
);

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  country_code char(2),
  city text,
  postal_code text,
  line1 text,
  line2 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  status cart_status not null default 'active',
  currency char(3) not null default 'USD',
  subtotal_amount numeric(12,2) not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  order_number text not null,
  status order_status not null default 'pending',
  currency char(3) not null default 'USD',
  subtotal_amount numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, order_number)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  supplier_product_id uuid references supplier_products(product_id) on delete set null,
  title text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table payment_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  provider payment_provider not null,
  provider_account_id text,
  provider_email text,
  onboarding_status text not null default 'not_started',
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, provider)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  provider payment_provider not null,
  provider_payment_id text,
  status payment_status not null default 'pending',
  currency char(3) not null,
  amount numeric(12,2) not null,
  platform_fee_amount numeric(12,2) not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  provider payment_provider not null,
  provider_transaction_id text,
  type text not null,
  status text not null,
  currency char(3) not null,
  gross_amount numeric(12,2) not null,
  fee_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null,
  occurred_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((store_id is not null) or (supplier_id is not null))
);

create table commission_rules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete cascade,
  plan subscription_plan,
  percentage_fee numeric(5,2) not null default 0,
  fixed_fee_amount numeric(12,2) not null default 0,
  currency char(3) not null default 'USD',
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check ((store_id is not null) or (supplier_id is not null))
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  sender_user_id uuid references users(id) on delete set null,
  subject text,
  body text not null,
  status message_status not null default 'open',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_suppliers_status on suppliers(status);
create index idx_stores_status on stores(status);
create index idx_products_status_kind on products(kind, status);
create index idx_products_owner on products(kind, owner_id);
create index idx_supplier_products_supplier on supplier_products(supplier_id);
create index idx_store_products_store on store_products(store_id);
create index idx_carts_store_status on carts(store_id, status);
create index idx_orders_store_status on orders(store_id, status);
create index idx_payments_store_status on payments(store_id, status);
create index idx_transactions_store on transactions(store_id, occurred_at desc);
create index idx_notifications_user on notifications(user_id, read_at, created_at desc);
create index idx_reports_status on reports(status, created_at desc);
