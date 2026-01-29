create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  status text default 'Active',
  created_at timestamp with time zone default now()
);

alter table vendors enable row level security;

do $$ begin
  create policy "Enable full access for all users" on vendors for all using (true);
exception when duplicate_object then null; end $$;

-- Seed some default vendors if empty
insert into vendors (name, status)
select 'Default Supplier', 'Active'
where not exists (select 1 from vendors);
