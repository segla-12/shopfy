-- Shopfy Moneroo payments support
-- Run this file in Supabase SQL Editor before enabling online payments.

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

create index if not exists idx_shopfy_store_orders_payment_status
  on public.shopfy_store_orders(payment_status);

create unique index if not exists idx_shopfy_store_orders_provider_transaction_id
  on public.shopfy_store_orders(provider_transaction_id)
  where provider_transaction_id is not null;

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

create index if not exists idx_shopfy_store_certification_payments_store_id
  on public.shopfy_store_certification_payments(store_id);

create index if not exists idx_shopfy_store_certification_payments_status
  on public.shopfy_store_certification_payments(status);

create unique index if not exists idx_shopfy_store_certification_payments_provider_payment_id
  on public.shopfy_store_certification_payments(provider_payment_id)
  where provider_payment_id is not null;

alter table public.shopfy_store_certification_payments enable row level security;

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
