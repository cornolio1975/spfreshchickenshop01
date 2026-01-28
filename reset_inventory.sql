-- 1. CLEANUP TRANSACTIONS (Keep Products & Vendors)
-- This removes all sales, purchases, and adjustments history.
truncate table sale_items, sales, purchase_items, purchases, inventory_adjustments cascade;

-- 2. RESET STOCK
-- Option A: Reset all stock to 0 (Start Fresh)
-- update products set stock = 0;

-- Option B: Reset stock to a "Sample" level (e.g., 50 units each) so you can test selling immediately.
update products set stock = 50, stock_status = 'In Stock'; 

-- 3. VERIFY
select count(*) as sales from sales;       -- Should be 0
select count(*) as products from products; -- Should stay same
