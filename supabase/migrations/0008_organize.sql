-- Arv — organizing a growing library: favorites and cook history.
-- Both are per-user; RLS restricts every row to its owner, which also means an
-- embedded select returns only the current user's favorite/cook rows.

create table if not exists recipe_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table if not exists recipe_cooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  cooked_at timestamptz not null default now()
);
create index if not exists recipe_cooks_user_recipe_idx
  on recipe_cooks (user_id, recipe_id, cooked_at desc);

alter table recipe_favorites enable row level security;
alter table recipe_cooks enable row level security;

drop policy if exists recipe_favorites_all on recipe_favorites;
create policy recipe_favorites_all on recipe_favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists recipe_cooks_all on recipe_cooks;
create policy recipe_cooks_all on recipe_cooks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

notify pgrst, 'reload schema';
