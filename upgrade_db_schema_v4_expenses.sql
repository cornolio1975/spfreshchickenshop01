-- Run this in your Supabase SQL Editor to create the shop_expenses table
CREATE TABLE IF NOT EXISTS shop_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    expense_type TEXT NOT NULL CHECK (expense_type IN ('Employee', 'Rent', 'Utilities', 'Other')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) if you are using it
ALTER TABLE shop_expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users (Adjust based on your security needs)
CREATE POLICY "Enable all actions for authenticated users on shop_expenses" 
ON shop_expenses FOR ALL TO authenticated USING (true);
