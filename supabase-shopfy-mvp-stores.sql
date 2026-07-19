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
  order_source text not null default 'platform' check (order_source in ('platform', 'manual')),
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
  seller_comment text not null default '',
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'XOF',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  action_user_id uuid references auth.users(id) on delete set null,
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
  activated_at timestamptz,
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

create index if not exists idx_shopfy_store_order_items_order_id
  on public.shopfy_store_order_items(order_id);

create index if not exists idx_shopfy_store_certification_payments_store_id
  on public.shopfy_store_certification_payments(store_id);

create index if not exists idx_shopfy_store_certification_payments_status
  on public.shopfy_store_certification_payments(status);

create unique index if not exists idx_shopfy_store_certification_payments_provider_payment_id
  on public.shopfy_store_certification_payments(provider_payment_id)
  where provider_payment_id is not null;

alter table public.shopfy_store_certification_payments
  add column if not exists activated_at timestamptz;

alter table public.shopfy_stores
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.shopfy_stores
  add column if not exists is_certified boolean not null default false,
  add column if not exists certification_started_at timestamptz,
  add column if not exists certification_expires_at timestamptz,
  add column if not exists certification_duration_months integer,
  add column if not exists certification_amount integer;

alter table public.shopfy_store_orders
  add column if not exists order_source text not null default 'platform',
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_provider text not null default 'manual',
  add column if not exists payment_reference text,
  add column if not exists provider_transaction_id text,
  add column if not exists payment_url text,
  add column if not exists payment_requested_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_error text,
  add column if not exists customer_email text not null default '',
  add column if not exists seller_comment text not null default '',
  add column if not exists cancelled_at timestamptz,
  add column if not exists action_user_id uuid references auth.users(id) on delete set null;

alter table public.shopfy_store_orders
  drop constraint if exists shopfy_store_orders_order_source_check,
  add constraint shopfy_store_orders_order_source_check
    check (order_source in ('platform', 'manual'));

alter table public.shopfy_store_orders
  drop constraint if exists shopfy_store_orders_payment_status_check,
  add constraint shopfy_store_orders_payment_status_check
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled'));

create index if not exists idx_shopfy_store_orders_payment_status
  on public.shopfy_store_orders(payment_status);

create unique index if not exists idx_shopfy_store_orders_provider_transaction_id
  on public.shopfy_store_orders(provider_transaction_id)
  where provider_transaction_id is not null;

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
      where stores.id = store_id
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
      where stores.id = store_id
        and stores.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = store_id
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
      where stores.id = store_id
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
      where stores.id = store_id
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
      where orders.id = order_id
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
      where stores.id = store_id
        and stores.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shopfy_stores stores
      where stores.id = store_id
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
      where stores.id = store_id
        and stores.owner_user_id = auth.uid()
    )
  );

create or replace function public.activate_shopfy_store_certification(
  p_payment_id uuid,
  p_paid_at timestamptz default now()
)
returns table (
  activated_store_id uuid,
  certification_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_record public.shopfy_store_certification_payments%rowtype;
  store_record public.shopfy_stores%rowtype;
  activation_start timestamptz;
  activation_base timestamptz;
  activation_expires timestamptz;
begin
  select *
    into payment_record
    from public.shopfy_store_certification_payments
   where id = p_payment_id
   for update;

  if not found then
    raise exception 'Certification payment not found.';
  end if;

  if payment_record.status <> 'paid' then
    raise exception 'Certification payment must be paid before activation.';
  end if;

  select *
    into store_record
    from public.shopfy_stores
   where id = payment_record.store_id
   for update;

  if not found then
    raise exception 'Store not found for certification payment.';
  end if;

  if payment_record.activated_at is not null then
    activated_store_id := store_record.id;
    certification_expires_at := store_record.certification_expires_at;
    return next;
    return;
  end if;

  activation_start := coalesce(p_paid_at, payment_record.paid_at, now());
  activation_base := greatest(activation_start, coalesce(store_record.certification_expires_at, activation_start));
  activation_expires := activation_base + make_interval(months => greatest(payment_record.duration_months, 1));

  update public.shopfy_stores
     set is_certified = true,
         certification_started_at = activation_start,
         certification_expires_at = activation_expires,
         certification_duration_months = payment_record.duration_months,
         certification_amount = payment_record.amount,
         updated_at = now()
   where id = payment_record.store_id;

  update public.shopfy_store_certification_payments
     set activated_at = now(),
         updated_at = now()
   where id = p_payment_id;

  activated_store_id := payment_record.store_id;
  certification_expires_at := activation_expires;
  return next;
end;
$$;

grant execute on function public.activate_shopfy_store_certification(uuid, timestamptz) to service_role;
