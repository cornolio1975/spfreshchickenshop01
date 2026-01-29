-- MASTER FIX SCRIPT (Run this in Supabase SQL Editor)

-- 1. FIX PRODUCTS
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  base_price numeric default 0,
  category text,
  stock numeric default 0,
  stock_status text default 'In Stock',
  unit_type text default 'Qty',
  created_at timestamp with time zone default now()
);

alter table products add column if not exists category text;
alter table products add column if not exists stock numeric default 0;
alter table products add column if not exists unit_type text default 'Qty';

alter table products enable row level security;
do $$ begin
  create policy "Enable all for products" on products for all using (true);
exception when duplicate_object then null; end $$;


-- 2. FIX VENDORS
create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status text default 'Active',
  created_at timestamp with time zone default now()
);

alter table vendors enable row level security;
do $$ begin
  create policy "Enable all for vendors" on vendors for all using (true);
exception when duplicate_object then null; end $$;


-- 3. FIX SETTINGS
create table if not exists company_settings (
  id uuid default gen_random_uuid() primary key,
  name text,
  updated_at timestamp with time zone default now()
);

alter table company_settings enable row level security;
do $$ begin
  create policy "Enable all for settings" on company_settings for all using (true);
exception when duplicate_object then null; end $$;

insert into company_settings (name) 
select 'SP FAMILY VENTURES EST ENTERPRISE' 
where not exists (select 1 from company_settings);
