-- Create Company Settings Table
create table if not exists company_settings (
  id uuid default gen_random_uuid() primary key,
  name text,
  address text,
  phone text,
  email text,
  tax_id text,
  website text,
  updated_at timestamp with time zone default now()
);

-- RLS
alter table company_settings enable row level security;

do $$ begin
  create policy "Enable full access for authenticated users" on company_settings for all using (true);
exception when duplicate_object then null; end $$;

-- Insert a default placeholder record if empty
insert into company_settings (name, address, phone)
select 'SP FAMILY VENTURES EST ENTERPRISE', '123 Main St', '012-3456789'
where not exists (select 1 from company_settings);
