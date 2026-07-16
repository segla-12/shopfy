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
  activated_at timestamptz,
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

alter table public.shopfy_store_certification_payments
  add column if not exists activated_at timestamptz;

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
