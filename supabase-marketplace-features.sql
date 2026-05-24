alter table public.products
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists seller_name text,
  add column if not exists seller_photo text;

create index if not exists products_country_idx on public.products(country);
create index if not exists products_city_idx on public.products(city);
create index if not exists products_phone_idx on public.products(phone);
