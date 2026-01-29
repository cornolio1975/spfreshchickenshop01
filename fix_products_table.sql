-- Comprehensive Fix for Products Table

-- 1. Create table if it doesn't exist at all
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  base_price numeric default 0,
  image_url text,
  category text,
  stock numeric default 0,
  stock_status text default 'In Stock',
  unit_type text default 'Qty',
  created_at timestamp with time zone default now()
);

-- 2. Ensure all columns exist (idempotent 'alter table' using 'if not exists')
alter table products add column if not exists category text;
alter table products add column if not exists stock numeric default 0;
alter table products add column if not exists stock_status text default 'In Stock';
alter table products add column if not exists unit_type text default 'Qty';
alter table products add column if not exists base_price numeric default 0;
alter table products add column if not exists image_url text;

-- 3. Enable RLS
alter table products enable row level security;

-- 4. Create Policy (Drop existing to avoid conflict, then re-create)
drop policy if exists "Enable all for products" on products;
create policy "Enable all for products" on products for all using (true);
