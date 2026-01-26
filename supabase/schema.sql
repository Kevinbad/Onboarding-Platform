-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  government_id text,
  country text,
  phone text,
  company text,
  dolar_tag text,
  contract_signed boolean default false,
  signed_at timestamp with time zone,
  contract_url text,
  salary text,
  role text default 'user' check (role in ('user', 'admin')),
  onboarding_status text default 'started' check (onboarding_status in ('started', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Helper to check if user is admin (Bypasses RLS to avoid recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Admin Policy (Admins can view all profiles)
-- Drop existing potential conflict first if manual running, but for schema file:
create policy "Admins can view all profiles" on profiles for select using (
  is_admin()
);

-- Create table for User Invites (Admin only)
create table if not exists public.user_invites (
  email text primary key,
  salary text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Invites
alter table user_invites enable row level security;

-- Only admins can manage invites
create policy "Admins can manage invites" on user_invites
    is_admin()
  );

-- Function to claim invite (Auto-healing)
create or replace function public.claim_invite()
returns boolean as $$
declare
  invite_record record;
  user_email text;
  user_id uuid;
begin
  user_id := auth.uid();
  select email into user_email from auth.users where id = user_id;
  
  if user_email is null then return false; end if;

  select * into invite_record from public.user_invites where lower(email) = lower(user_email);

  if invite_record is null then return false; end if;

  insert into public.profiles (id, full_name, role, salary, onboarding_status)
  values (
    user_id,
    (select raw_user_meta_data->>'full_name' from auth.users where id = user_id),
    coalesce(invite_record.role, 'user'),
    invite_record.salary,
    'started'
  )
  on conflict (id) do update
  set 
    role = excluded.role,
    salary = excluded.salary,
    onboarding_status = coalesce(profiles.onboarding_status, 'started');

  delete from public.user_invites where email = invite_record.email;

  return true;
end;
$$ language plpgsql security definer;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  invite_record record;
begin
  -- Check for existing invite
  select * into invite_record from public.user_invites where lower(email) = lower(new.email);

  insert into public.profiles (id, full_name, role, salary)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    coalesce(invite_record.role, 'user'), -- Use invited role or default to user
    invite_record.salary -- Use invited salary
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger logic (commented out by default to avoid errors if already exists, user should run if needed)
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Storage Bucket for Contracts
insert into storage.buckets (id, name, public) 
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- RLS for Storage (users can only read/write their own files)
create policy "Users can upload own contract"
on storage.objects for insert
with check ( bucket_id = 'contracts' and auth.uid() = owner );

create policy "Users can read own contract"
on storage.objects for select
using ( bucket_id = 'contracts' and (
  auth.uid() = owner OR 
  exists (select 1 from profiles where id = auth.uid() and role = 'admin') -- Admins can read contracts
));

-- Create companies table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on companies
alter table companies enable row level security;

-- Policies for companies
create policy "Enable read access for all users" on companies
  for select using (true);

-- Seed initial companies
insert into public.companies (name) values
  ('Capstone Insurance Group'),
  ('Diversity Group'),
  ('GMG Advisors'),
  ('Flex Global')
on conflict (name) do nothing;
