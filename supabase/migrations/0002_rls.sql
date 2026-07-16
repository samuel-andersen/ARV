-- Arv — Row Level Security.
-- Everything is owner/contributor-scoped except public recipe pages, which are
-- readable only when is_public = true. Helper functions are SECURITY DEFINER so
-- membership checks don't recurse through the policies that call them.

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------
create or replace function is_book_owner(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.books b
    where b.id = bid and b.owner_id = auth.uid()
  );
$$;

create or replace function is_book_member(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select public.is_book_owner(bid) or exists (
    select 1 from public.book_contributors c
    where c.book_id = bid
      and c.user_id = auth.uid()
      and c.accepted_at is not null
  );
$$;

create or replace function owns_recipe(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = rid and r.owner_id = auth.uid()
  );
$$;

-- Can the current user read this recipe? Owner, public, or a member of any
-- book that includes it. Used by the recipe children's SELECT policies.
create or replace function can_read_recipe(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = rid and (r.owner_id = auth.uid() or r.is_public)
  ) or exists (
    select 1
    from public.book_recipes br
    join public.book_chapters ch on ch.id = br.chapter_id
    where br.recipe_id = rid and public.is_book_member(ch.book_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table profiles           enable row level security;
alter table recipes            enable row level security;
alter table ingredients        enable row level security;
alter table steps              enable row level security;
alter table tags               enable row level security;
alter table recipe_tags        enable row level security;
alter table import_jobs        enable row level security;
alter table books              enable row level security;
alter table book_chapters      enable row level security;
alter table book_recipes       enable row level security;
alter table book_contributors  enable row level security;
alter table book_exports       enable row level security;
alter table orders             enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own on profiles
  for select using (id = auth.uid());
create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- recipes  (owner full access; public read; book members read)
-- ---------------------------------------------------------------------------
-- Read the row's OWN columns directly for the owner/public case so
-- INSERT ... RETURNING can see a just-inserted row. (A SECURITY DEFINER helper
-- that re-looks-up the row by id does not see the new row in the same
-- statement, which broke every insert-with-returning.) The book-membership
-- lookup still uses the helper.
create policy recipes_select on recipes
  for select using (
    owner_id = auth.uid()
    or is_public
    or exists (
      select 1
      from book_recipes br
      join book_chapters ch on ch.id = br.chapter_id
      where br.recipe_id = recipes.id and is_book_member(ch.book_id)
    )
  );
create policy recipes_insert on recipes
  for insert with check (owner_id = auth.uid());
create policy recipes_update on recipes
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy recipes_delete on recipes
  for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ingredients / steps  (inherit recipe access)
-- ---------------------------------------------------------------------------
create policy ingredients_select on ingredients
  for select using (can_read_recipe(recipe_id));
create policy ingredients_write on ingredients
  for all using (owns_recipe(recipe_id)) with check (owns_recipe(recipe_id));

create policy steps_select on steps
  for select using (can_read_recipe(recipe_id));
create policy steps_write on steps
  for all using (owns_recipe(recipe_id)) with check (owns_recipe(recipe_id));

-- ---------------------------------------------------------------------------
-- tags  (global vocabulary) / recipe_tags (inherit recipe access)
-- ---------------------------------------------------------------------------
create policy tags_select on tags
  for select using (auth.role() = 'authenticated');
create policy tags_insert on tags
  for insert with check (auth.role() = 'authenticated');

create policy recipe_tags_select on recipe_tags
  for select using (can_read_recipe(recipe_id));
create policy recipe_tags_write on recipe_tags
  for all using (owns_recipe(recipe_id)) with check (owns_recipe(recipe_id));

-- ---------------------------------------------------------------------------
-- import_jobs  (strictly owner)
-- ---------------------------------------------------------------------------
create policy import_jobs_all on import_jobs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- books  (members read; owner mutates)
-- ---------------------------------------------------------------------------
-- Direct column read for the owner case (see recipes_select note) so
-- INSERT ... RETURNING sees the new book; membership still uses the join.
create policy books_select on books
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from book_contributors c
      where c.book_id = books.id and c.user_id = auth.uid() and c.accepted_at is not null
    )
  );
create policy books_insert on books
  for insert with check (owner_id = auth.uid());
create policy books_update on books
  for update using (is_book_owner(id)) with check (is_book_owner(id));
create policy books_delete on books
  for delete using (is_book_owner(id));

-- ---------------------------------------------------------------------------
-- book_chapters  (members read; owner mutates)
-- ---------------------------------------------------------------------------
create policy book_chapters_select on book_chapters
  for select using (is_book_member(book_id));
create policy book_chapters_write on book_chapters
  for all using (is_book_owner(book_id)) with check (is_book_owner(book_id));

-- ---------------------------------------------------------------------------
-- book_recipes  (members read; owner manages all, contributor manages own)
-- ---------------------------------------------------------------------------
create policy book_recipes_select on book_recipes
  for select using (
    exists (
      select 1 from book_chapters ch
      where ch.id = chapter_id and is_book_member(ch.book_id)
    )
  );
create policy book_recipes_insert on book_recipes
  for insert with check (
    exists (
      select 1 from book_chapters ch
      where ch.id = chapter_id and (
        is_book_owner(ch.book_id)
        or (is_book_member(ch.book_id) and owns_recipe(recipe_id))
      )
    )
  );
create policy book_recipes_update on book_recipes
  for update using (
    exists (
      select 1 from book_chapters ch
      where ch.id = chapter_id and (is_book_owner(ch.book_id) or owns_recipe(recipe_id))
    )
  );
create policy book_recipes_delete on book_recipes
  for delete using (
    exists (
      select 1 from book_chapters ch
      where ch.id = chapter_id and (is_book_owner(ch.book_id) or owns_recipe(recipe_id))
    )
  );

-- ---------------------------------------------------------------------------
-- book_contributors  (owner manages invites; invitee sees/accepts own)
-- ---------------------------------------------------------------------------
create policy book_contributors_select on book_contributors
  for select using (
    is_book_member(book_id)
    or user_id = auth.uid()
    or invited_email = (auth.jwt() ->> 'email')
  );
create policy book_contributors_insert on book_contributors
  for insert with check (is_book_owner(book_id));
create policy book_contributors_update on book_contributors
  for update using (
    is_book_owner(book_id)
    or user_id = auth.uid()
    or invited_email = (auth.jwt() ->> 'email')
  ) with check (
    is_book_owner(book_id) or user_id = auth.uid()
  );
create policy book_contributors_delete on book_contributors
  for delete using (is_book_owner(book_id));

-- ---------------------------------------------------------------------------
-- book_exports  (members read; owner writes)
-- ---------------------------------------------------------------------------
create policy book_exports_select on book_exports
  for select using (is_book_member(book_id));
create policy book_exports_write on book_exports
  for all using (is_book_owner(book_id)) with check (is_book_owner(book_id));

-- ---------------------------------------------------------------------------
-- orders  (owner only)
-- ---------------------------------------------------------------------------
create policy orders_all on orders
  for all using (is_book_owner(book_id)) with check (is_book_owner(book_id));

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('recipe-images', 'recipe-images', true),
  ('screenshots', 'screenshots', false),
  ('book-exports', 'book-exports', false)
on conflict (id) do nothing;

-- recipe-images: public read; users write within their own uid/ folder.
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

-- screenshots + book-exports: private, owner-scoped by uid/ folder.
create policy private_objects_read on storage.objects
  for select using (
    bucket_id in ('screenshots', 'book-exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy private_objects_write on storage.objects
  for insert with check (
    bucket_id in ('screenshots', 'book-exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy private_objects_delete on storage.objects
  for delete using (
    bucket_id in ('screenshots', 'book-exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
