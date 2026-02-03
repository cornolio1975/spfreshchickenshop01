-- UPGRADE SCHEMA V2 (Shop Segregation & Reset)

-- 1. Add shop_id to SALES
-- Check if table exists first (it should)
do $$ begin
  alter table sales add column if not exists shop_id uuid references shops(id);
exception when undefined_table then
  -- If sales doesn't exist, create it (safe fallback)
  create table sales (
    id uuid default gen_random_uuid() primary key,
    shop_id uuid references shops(id),
    total_amount numeric not null,
    payment_method text default 'cash',
    status text default 'completed',
    created_at timestamp with time zone default now()
  );
end $$;

-- 2. Add shop_id to PURCHASES
do $$ begin
  alter table purchases add column if not exists shop_id uuid references shops(id);
exception when undefined_table then null; end $$;

-- 3. Add shop_id to INVENTORY_ADJUSTMENTS
do $$ begin
  alter table inventory_adjustments add column if not exists shop_id uuid references shops(id);
exception when undefined_table then null; end $$;

-- 4. Create RESET Function
create or replace function reset_shop_data(p_shop_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete Sales (Cascade should handle sale_items if defined, otherwise we might need manual delete)
  -- Assuming sale_items references sales(id) on delete cascade.
  -- If not, we try delete items first.
  
  -- Safe deletion order:
  
  -- 1. Sales & Items
  -- Check if sale_items exists
  begin
    delete from sale_items where sale_id in (select id from sales where shop_id = p_shop_id);
  exception when undefined_table then null; end;
  
  delete from sales where shop_id = p_shop_id;
  
  -- 2. Purchases & Items
  begin
    delete from purchase_items where purchase_id in (select id from purchases where shop_id = p_shop_id);
  exception when undefined_table then null; end;
  
  delete from purchases where shop_id = p_shop_id;

  -- 3. Adjustments
  delete from inventory_adjustments where shop_id = p_shop_id;

  -- 4. Inventory (Hard Delete)
  delete from inventory where shop_id = p_shop_id;
  
end;
$$;
