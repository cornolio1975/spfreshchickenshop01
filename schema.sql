-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- SHOPS Table
create table shops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USER ROLES / PROFILES (Linked to Auth)
create table user_profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  role text check (role in ('admin', 'manager', 'cashier')) default 'cashier',
  shop_id uuid references shops(id), -- Null for super-admins, specific for staff
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS (Global catalog, prices can be overridden per shop if needed, but keeping simple for now)
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  base_price decimal(10,2) not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVENTORY (Links Product to Shop with Quantity)
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) not null,
  product_id uuid references products(id) not null,
  quantity decimal(10,2) default 0,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(shop_id, product_id)
);

-- TRANSACTIONS (Sales Headers)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) not null,
  user_id uuid references auth.users(id),
  total_amount decimal(10,2) not null,
  payment_method text check (payment_method in ('cash', 'bank', 'other')),
  status text default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTION ITEMS
create table transaction_items (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) not null,
  product_id uuid references products(id) not null,
  quantity decimal(10,2) not null,
  price_at_sale decimal(10,2) not null
);

-- RLS POLICIES (Basic)
alter table shops enable row level security;
alter table user_profiles enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- Admin can see all, Check RLS needed later
create policy "Public Read" on shops for select using (true);
create policy "Public Read" on products for select using (true);
