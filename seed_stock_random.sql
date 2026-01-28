-- 1. CLEANUP TRANSACTIONS (Delete Sales, Purchases, Adjustments)
truncate table sale_items, sales, purchase_items, purchases, inventory_adjustments cascade;

-- 2. SEED STOCK (Sample Data)
-- Updates all existing products with a random stock count between 10 and 100.
update products 
set 
  stock = floor(random() * 90 + 10), -- Random stock 10-100
  stock_status = 'In Stock';

-- 3. VERIFY
select name, stock, stock_status from products order by name;
