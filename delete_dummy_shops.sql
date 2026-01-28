-- 1. DELETE DUMMY SHOPS
-- Removes the default sample shops if they exist in the database.
delete from shops 
where name in ('Main Street Chicken', 'Westside Market', 'Downtown Branch');

-- 2. VERIFY
select * from shops;
