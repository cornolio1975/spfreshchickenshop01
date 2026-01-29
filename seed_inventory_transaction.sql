-- 0. SCHEMA FIX (Ensure columns exist)
alter table purchases add column if not exists remarks text;
alter table purchases add column if not exists purchase_date date default current_date;

-- 1. CLEANUP (Wipe history)
truncate table sale_items, sales, purchase_items, purchases, inventory_adjustments cascade;

-- 2. ENSURE VENDOR EXISTS
insert into vendors (name, contact_person, status)
values ('Whole Foods Supplier', 'System Importer', 'Active')
on conflict do nothing;

-- 3. GENERATE OPENING STOCK PURCHASE
with new_purchase as (
  insert into purchases (vendor_id, total_cost, remarks, purchase_date)
  select id, 0, 'Opening Stock Load', current_date
  from vendors limit 1
  returning id
)
insert into purchase_items (purchase_id, product_id, quantity, unit_cost, total_cost)
select 
  (select id from new_purchase), -- Link to the new purchase
  id,                            -- Product ID
  floor(random() * 30 + 20),     -- Random Qty 20-50
  base_price * 0.8,              -- Unit Cost (80% of selling price)
  (floor(random() * 30 + 20)) * (base_price * 0.8) -- Total Cost
from products;

-- 4. UPDATE PRODUCT STOCK TO MATCH
update products p
set 
  stock = (select sum(quantity) from purchase_items pi where pi.product_id = p.id),
  stock_status = 'In Stock'; 

-- 5. UPDATE PURCHASE TOTAL COST
update purchases p
set total_cost = (select sum(total_cost) from purchase_items pi where pi.purchase_id = p.id)
where remarks = 'Opening Stock Load';

-- 6. VERIFY
select name, stock from products;
