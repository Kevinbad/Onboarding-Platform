-- Function: claim_invite
-- Purpose: Allows an existing user (who is stuck/blocked) to manually claim an invite if their email matches one in the system.
-- This creates/updates their profile with the salary/role from the invite.

create or replace function public.claim_invite()
returns boolean as $$
declare
  invite_record record;
  user_email text;
  user_id uuid;
begin
  -- Get current user email and id
  user_id := auth.uid();
  select email into user_email from auth.users where id = user_id;
  
  if user_email is null then
    return false;
  end if;

  -- Check for invite (case insensitive)
  select * into invite_record from public.user_invites where lower(email) = lower(user_email);

  if invite_record is null then
    return false;
  end if;

  -- Upsert Profile
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
    -- Don't reset onboarding_status if they were already doing it, unless we really want a hard reset?
    -- If they were blocked, maybe they want to resume?
    -- If we want to UNBLOCK, we should probably ensure it is at least 'started'.
    onboarding_status = coalesce(profiles.onboarding_status, 'started');

  -- Delete the invite (Consume it)
  delete from public.user_invites where email = invite_record.email;

  return true;
end;
$$ language plpgsql security definer;
