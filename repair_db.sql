-- 1. REPAIR SCHEMA (Create tables if they were missed)
create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  status text default 'Active',
  created_at timestamp with time zone default now()
);

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

alter table products add column if not exists stock numeric default 0;

-- Enable RLS just in case
alter table vendors enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table inventory_adjustments enable row level security;

-- Policies (safe to retry, might error if exist but that's fine for manual run)
do $$ begin
  create policy "Enable all for vendors" on vendors for all using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Enable all for purchases" on purchases for all using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Enable all for purchase_items" on purchase_items for all using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Enable all for inventory_adjustments" on inventory_adjustments for all using (true);
exception when duplicate_object then null; end $$;


-- 2. NOW RESET DATA
-- Now that tables exist, we can safely truncate them
truncate table sale_items, sales, purchase_items, purchases, inventory_adjustments cascade;

-- Reset Stock to 50 for testing
update products set stock = 50, stock_status = 'In Stock';
