-- MASTER FIX SCRIPT (Run this in Supabase SQL Editor)
-- Version: 2.0 (Complete Inventory Support)

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


-- 4. FIX PURCHASES & INVENTORY
create table if not exists purchases (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id),
  total_cost numeric not null,
  purchase_date date default current_date,
  remarks text,
  created_at timestamp with time zone default now()
);

create table if not exists purchase_items (
  id uuid default gen_random_uuid() primary key,
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric not null,
  unit_cost numeric not null,
  total_cost numeric not null
);

create table if not exists inventory_adjustments (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id),
  quantity numeric not null,
  reason text not null,
  remarks text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for Inventory tables
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table inventory_adjustments enable row level security;

-- Policies for Inventory
do $$ begin
  create policy "Enable all for purchases" on purchases for all using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Enable all for purchase_items" on purchase_items for all using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Enable all for inventory_adjustments" on inventory_adjustments for all using (true);
exception when duplicate_object then null; end $$;
