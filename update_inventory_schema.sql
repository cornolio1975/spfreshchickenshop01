-- Update Inventory Schema for Shop Specific Tracking

-- 1. Ensure Inventory Table exists and has correct columns
create table if not exists inventory (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references shops(id) not null,
  product_id uuid references products(id) not null,
  quantity numeric default 0,
  last_updated timestamp with time zone default now(),
  unique(shop_id, product_id)
);

alter table inventory enable row level security;
do $$ begin
  create policy "Enable all for inventory" on inventory for all using (true);
exception when duplicate_object then null; end $$;


-- 2. Add shop_id to Purchases
alter table purchases add column if not exists shop_id uuid references shops(id);

-- 3. Add shop_id to Inventory Adjustments
alter table inventory_adjustments add column if not exists shop_id uuid references shops(id);

-- 4. Create function to safely update inventory
create or replace function update_shop_inventory(
  p_shop_id uuid,
  p_product_id uuid,
  p_quantity_change numeric
) returns void as $$
begin
  insert into inventory (shop_id, product_id, quantity)
  values (p_shop_id, p_product_id, p_quantity_change)
  on conflict (shop_id, product_id)
  do update set 
    quantity = inventory.quantity + p_quantity_change,
    last_updated = now();
end;
$$ language plpgsql;
