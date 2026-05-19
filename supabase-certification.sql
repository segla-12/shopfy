alter table public.products
  add column if not exists certification_started_at timestamptz,
  add column if not exists certification_expires_at timestamptz,
  add column if not exists certification_duration_months integer,
  add column if not exists certification_amount integer;

