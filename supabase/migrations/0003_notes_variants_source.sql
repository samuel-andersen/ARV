-- Arv — design features: recipe notes, "view original" raw text.
-- (Variants reuse the recipes table; orders already exist in 0001.)

-- Original imported text, preserved for "Vis originalen".
alter table recipes add column if not exists source_raw text;

-- ---------------------------------------------------------------------------
-- recipe_notes — the user's margin notes ("Mine notater"), printed in the book.
-- ---------------------------------------------------------------------------
create table if not exists recipe_notes (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists recipe_notes_recipe_idx on recipe_notes (recipe_id, created_at);

alter table recipe_notes enable row level security;

-- Readable by anyone who can read the recipe; writable only by the recipe owner
-- (and the row's author is always the writer).
drop policy if exists recipe_notes_select on recipe_notes;
create policy recipe_notes_select on recipe_notes
  for select to authenticated using (can_read_recipe(recipe_id));

drop policy if exists recipe_notes_write on recipe_notes;
create policy recipe_notes_write on recipe_notes
  for all to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and owns_recipe(recipe_id));
