-- Add email column if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
        alter table public.profiles add column email text;
    end if;
end $$;

-- Update existing profiles with email from auth.users (if possible)
-- Note: We can't access auth.users easily in a simple update without a function/view bypass, 
-- but we can update specifically the broken ones if we knew them. 
-- For now, let's rely on claim_invite to do it for new/claimed ones.

-- Update claim_invite to save email
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

  insert into public.profiles (id, full_name, email, role, salary, onboarding_status)
  values (
    user_id,
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = user_id), user_email), -- Fallback to email if name is null
    user_email,
    coalesce(invite_record.role, 'user'),
    invite_record.salary,
    'started'
  )
  on conflict (id) do update
  set 
    email = excluded.email, -- Update email
    full_name = coalesce(profiles.full_name, excluded.full_name), -- Keep existing name if set, else use new
    role = excluded.role,
    salary = excluded.salary,
    onboarding_status = coalesce(profiles.onboarding_status, 'started');

  delete from public.user_invites where email = invite_record.email;

  return true;
end;
$$ language plpgsql security definer;
