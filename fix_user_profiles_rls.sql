-- RLS Policies for user_profiles

-- 1. VIEW: Users can view their own profile
drop policy if exists "Users can view own profile" on user_profiles;
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- 2. UPDATE: Users can update their own profile
drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- 3. INSERT: Users can insert their own profile
drop policy if exists "Users can insert own profile" on user_profiles;
create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);
