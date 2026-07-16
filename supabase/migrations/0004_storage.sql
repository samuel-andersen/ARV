-- Arv — recipe cover-image storage (idempotent).
-- Safe to run on its own if the `recipe-images` bucket/policies from 0002 were
-- never applied. Public read; each user writes only within their own uid/ folder.

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update set public = true;

drop policy if exists recipe_images_read on storage.objects;
drop policy if exists recipe_images_write on storage.objects;
drop policy if exists recipe_images_update on storage.objects;
drop policy if exists recipe_images_delete on storage.objects;

create policy recipe_images_read on storage.objects
  for select using (bucket_id = 'recipe-images');
create policy recipe_images_write on storage.objects
  for insert with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy recipe_images_update on storage.objects
  for update using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy recipe_images_delete on storage.objects
  for delete using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
