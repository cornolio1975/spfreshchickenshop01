-- Helper function to calculate stock difference and update inventory
-- This is crucial for "Editing" a sale where quantity changes.

-- 1. Function to Update Sale Item Quantity & Adjust Stock
create or replace function update_sale_item_quantity(
  p_sale_item_id uuid,
  p_new_quantity numeric,
  p_new_price numeric default null
) returns void
language plpgsql
security definer
as $$
declare
  v_old_quantity numeric;
  v_product_id uuid;
  v_shop_id uuid;
  v_diff numeric;
begin
  -- Get old details
  select quantity, product_id, sales.shop_id 
  into v_old_quantity, v_product_id, v_shop_id
  from sale_items
  join sales on sales.id = sale_items.sale_id
  where sale_items.id = p_sale_item_id;

  if not found then
    raise exception 'Sale Item not found';
  end if;

  -- Calculate Difference
  -- If new (5) > old (3), diff is +2. We need to DEDUCT 2 more from stock.
  -- If new (2) < old (5), diff is -3. We need to ADD 3 back to stock.
  v_diff := p_new_quantity - v_old_quantity;

  -- Update Sale Item
  update sale_items
  set 
    quantity = p_new_quantity,
    unit_price = coalesce(p_new_price, unit_price),
    total_price = (coalesce(p_new_price, unit_price) * p_new_quantity)
  where id = p_sale_item_id;

  -- Update Stock (Inverse of Diff)
  -- update_shop_inventory(shop_id, product_id, change)
  -- If diff is positive (sales increased), inventory decreases (-diff)
  -- If diff is negative (sales decreased), inventory increases (-diff = positive)
  
  -- We'll use direct update if the wrapper func doesn't exist, but let's try to be safe
  update products
  set stock = stock - v_diff
  where id = v_product_id;

  -- Recalculate Sale Total
  update sales
  set total_amount = (select sum(total_price) from sale_items where sale_id = sales.id)
  where id = (select sale_id from sale_items where id = p_sale_item_id);

end;
$$;

-- 2. Function to DELETE a Sale (Void/Refund) and Return Stock
create or replace function delete_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  -- Loop through items to return stock
  for r in (select product_id, quantity from sale_items where sale_id = p_sale_id) loop
    update products
    set stock = stock + r.quantity
    where id = r.product_id;
  end loop;

  -- Delete Items (Cascade might handle this, but explicit is safer for logic)
  delete from sale_items where sale_id = p_sale_id;

  -- Delete Sale
  delete from sales where id = p_sale_id;
end;
$$;

-- 3. Function to Delete/Reverse a Purchase (Stock Correction)
create or replace function delete_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  -- Loop through items to REVERSE stock (Deduct what was added)
  for r in (select product_id, quantity from purchase_items where purchase_id = p_purchase_id) loop
    update products
    set stock = stock - r.quantity
    where id = r.product_id;
  end loop;

  delete from purchase_items where purchase_id = p_purchase_id;
  delete from purchases where id = p_purchase_id;
end;
$$;

-- 4. Function to Update Purchase Item Quantity
create or replace function update_purchase_item_quantity(
  p_item_id uuid,
  p_new_qty numeric
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_qty numeric;
  v_product_id uuid;
  v_diff numeric;
begin
  select quantity, product_id into v_old_qty, v_product_id
  from purchase_items where id = p_item_id;

  v_diff := p_new_qty - v_old_qty;

  update purchase_items
  set 
    quantity = p_new_qty,
    total_cost = unit_cost * p_new_qty
  where id = p_item_id;

  -- If diff is positive (bought more), add to stock (+diff)
  update products
  set stock = stock + v_diff
  where id = v_product_id;

  -- Update Header Total
  update purchases
  set total_cost = (select sum(total_cost) from purchase_items where purchase_id = purchases.id)
  where id = (select purchase_id from purchase_items where id = p_item_id);
end;
$$;
