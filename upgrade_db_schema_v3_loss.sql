-- Run this in your Supabase SQL Editor to add the new date and price columns to inventory_adjustments
ALTER TABLE inventory_adjustments 
ADD COLUMN IF NOT EXISTS adjustment_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_value NUMERIC(10, 2) DEFAULT 0;
