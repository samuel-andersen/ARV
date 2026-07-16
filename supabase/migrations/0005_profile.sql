-- Arv — richer profiles: avatar + short bio, and an avatars storage bucket.
-- Idempotent; safe to run on its own.

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;

-- avatars bucket: public read; each user writes only within their own uid/ folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_read on storage.objects;
drop policy if exists avatars_write on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy avatars_update on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy avatars_delete on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
