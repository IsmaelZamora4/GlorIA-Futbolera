-- Correct deployments that already ran the original profile migration while
-- keeping fresh installs and repeated application on the same private policy.
update storage.buckets
set public = false
where id = 'profile-avatars';

drop policy if exists "Profile avatars are publicly readable" on storage.objects;
drop policy if exists "Users can read their own profile avatar" on storage.objects;

create policy "Users can read their own profile avatar"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
