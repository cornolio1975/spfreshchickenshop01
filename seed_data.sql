-- 1. CLEANUP (Delete old data)
-- This removes all sales, purchases, adjustments, and products to start fresh.
truncate table sale_items, sales, purchase_items, purchases, inventory_adjustments cascade;
delete from products;
delete from vendors;

-- 2. SEED PRODUCTS (Global Catalog Sample Data)
insert into products (name, category, base_price, unit_type, stock, stock_status) values
('Fresh Whole Chicken', 'Raw', 12.50, 'Kg', 50, 'In Stock'),
('Chicken Breast', 'Parts', 18.00, 'Kg', 30, 'In Stock'),
('Chicken Thighs', 'Parts', 15.00, 'Kg', 40, 'In Stock'),
('Chicken Wings', 'Parts', 16.00, 'Kg', 40, 'In Stock'),
('Chicken Drumsticks', 'Parts', 16.50, 'Kg', 35, 'In Stock'),
('Chicken Liver', 'Parts', 8.00, 'Kg', 10, 'Low Stock'),
('Chicken Feet', 'Parts', 5.00, 'Kg', 20, 'In Stock'),
('Kampung Chicken', 'Raw', 22.00, 'Kg', 15, 'In Stock'),
('Fresh Eggs (Tray)', 'Eggs', 14.00, 'Qty', 100, 'In Stock'),
('Curry Powder', 'Spices', 3.50, 'Qty', 50, 'In Stock');

-- 3. SEED VENDORS
insert into vendors (name, contact_person, phone, email, address, status) values
('Farm Best Poultry', 'Mr. Lee', '012-3456789', 'lee@farmbest.com', '123 Farm Road, Selangor', 'Active'),
('Segar Supplies', 'Ah Meng', '019-8765432', 'meng@segar.com', '45 Pasar Borong, KL', 'Active');

-- 4. VERIFY
select count(*) as products_count from products;
