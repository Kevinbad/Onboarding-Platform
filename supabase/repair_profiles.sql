-- Helper function to sync profiles with auth.users data
-- This is useful if profiles were created before schema updates or if metadata was missing
create or replace function public.sync_profiles_from_auth()
returns void as $$
declare
  user_record record;
  meta_fullname text;
begin
  for user_record in select id, email, raw_user_meta_data from auth.users loop
    
    meta_fullname := user_record.raw_user_meta_data->>'full_name';
    
    -- Update profile if it exists
    update public.profiles
    set 
        email = coalesce(profiles.email, user_record.email),
        full_name = coalesce(profiles.full_name, meta_fullname, 'User ' || substring(user_record.email from 1 for 5))
    where id = user_record.id;
    
  end loop;
end;
$$ language plpgsql security definer;

-- Run the sync immediately
select public.sync_profiles_from_auth();
