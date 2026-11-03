create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  timezone text not null default 'America/Lima' check (timezone in ('America/Lima', 'America/Bogota', 'America/Argentina/Buenos_Aires', 'Europe/Madrid')),
  favorite_competitions text[] not null default array['Premier League']::text[],
  avatar_path text,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_profiles_favorites_valid check (
    favorite_competitions <@ array['Liga 1', 'Premier League', 'Serie A', 'LaLiga', 'Ligue 1', 'Bundesliga', 'Champions League', 'Europa League']::text[]
  )
);

alter table public.user_profiles enable row level security;
revoke all on table public.user_profiles from public, anon;
grant select, insert, update on table public.user_profiles to authenticated;

create policy "Users can view their own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Profile avatars are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'profile-avatars');

create policy "Users can upload their own profile avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own profile avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own profile avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
