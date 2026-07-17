-- Arv — full database setup (run once in the Supabase SQL Editor).
-- This is migrations 0001_init.sql + 0002_rls.sql concatenated in order.
-- After this succeeds, your Arv database is ready. Seed data is optional
-- (see supabase/seed.sql) and NOT included here.

-- ============================================================
-- 0001_init.sql
-- ============================================================
-- Arv — initial schema.
-- Mirrors lib/schemas/* (Zod). Enum values must stay in lockstep with common.ts.
-- RLS policies live in 0002_rls.sql; this file is structure only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type plan as enum ('free', 'pro');
create type source_platform as enum ('youtube', 'instagram', 'tiktok', 'web', 'manual');
create type import_status as enum ('pending', 'fetching', 'analyzing', 'review', 'done', 'failed');
create type book_style as enum ('editorial', 'rustic', 'minimal');
create type book_status as enum ('draft', 'ready', 'ordered');
create type contributor_role as enum ('owner', 'contributor');
create type order_status as enum ('draft', 'quoted', 'submitted', 'in_production', 'shipped', 'delivered', 'failed');
create type page_template as enum (
  'full_bleed_photo', 'photo_and_recipe', 'text_only_recipe',
  'chapter_opener', 'dedication', 'toc'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  plan plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Create a profile row automatically for each new auth user.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- recipes + children
-- ---------------------------------------------------------------------------
create table recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  story text,
  servings integer not null default 4 check (servings > 0),
  prep_min integer check (prep_min >= 0),
  cook_min integer check (cook_min >= 0),
  image_url text,
  source_platform source_platform not null default 'manual',
  source_url text,
  source_author text,
  is_original boolean not null default true,
  normalized boolean not null default false,
  share_slug text unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_owner_idx on recipes (owner_id);
create index recipes_public_idx on recipes (share_slug) where is_public;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  position integer not null,
  quantity numeric,
  unit text,
  name text not null,
  note text,
  needs_review boolean not null default false
);

create index ingredients_recipe_idx on ingredients (recipe_id, position);

create table steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  position integer not null,
  text text not null,
  timer_seconds integer check (timer_seconds > 0)
);

create index steps_recipe_idx on steps (recipe_id, position);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table recipe_tags (
  recipe_id uuid not null references recipes (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- import_jobs
-- ---------------------------------------------------------------------------
create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  source_url text,
  status import_status not null default 'pending',
  layers_used text[] not null default '{}',
  raw_caption text,
  transcript text,
  error text,
  recipe_id uuid references recipes (id) on delete set null,
  created_at timestamptz not null default now()
);

create index import_jobs_user_idx on import_jobs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- books + structure
-- ---------------------------------------------------------------------------
create table books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  subtitle text,
  style book_style not null default 'editorial',
  trim_size text not null default '20x25',
  status book_status not null default 'draft',
  cover_image text,
  dedication text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_owner_idx on books (owner_id);

create trigger books_updated_at
  before update on books
  for each row execute function set_updated_at();

create table book_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  position integer not null,
  title text not null,
  intro_text text,
  intro_image text
);

create index book_chapters_book_idx on book_chapters (book_id, position);

create table book_recipes (
  chapter_id uuid not null references book_chapters (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  position integer not null,
  template_override page_template,
  primary key (chapter_id, recipe_id)
);

create index book_recipes_chapter_idx on book_recipes (chapter_id, position);
create index book_recipes_recipe_idx on book_recipes (recipe_id);

create table book_contributors (
  book_id uuid not null references books (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  role contributor_role not null default 'contributor',
  invited_email text,
  accepted_at timestamptz,
  -- A row is keyed by (book, user) once accepted; before acceptance the invite
  -- is tracked by email. Enforce uniqueness on both dimensions.
  unique (book_id, user_id),
  unique (book_id, invited_email)
);

create index book_contributors_user_idx on book_contributors (user_id);
create index book_contributors_email_idx on book_contributors (invited_email);

create table book_exports (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  pdf_url text not null,
  page_count integer not null check (page_count between 24 and 200),
  generated_at timestamptz not null default now()
);

create index book_exports_book_idx on book_exports (book_id, generated_at desc);

-- ---------------------------------------------------------------------------
-- orders (stubbed fulfillment)
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  provider text not null default 'gelato',
  status order_status not null default 'draft',
  recipient_name text,
  recipient_address text,
  gift_note text,
  copies int not null default 1,
  amount_cents int,
  currency text not null default 'nok',
  created_at timestamptz not null default now()
);

create index orders_book_idx on orders (book_id, created_at desc);

-- ============================================================
-- 0002_rls.sql
-- ============================================================
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

-- Book members can see each other's name and photo (the family dimension).
create or replace function shares_book_with(other uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.books b
    where (
        b.owner_id = auth.uid()
        or exists (
          select 1 from public.book_contributors c
          where c.book_id = b.id and c.user_id = auth.uid() and c.accepted_at is not null
        )
      )
      and (
        b.owner_id = other
        or exists (
          select 1 from public.book_contributors c2
          where c2.book_id = b.id and c2.user_id = other and c2.accepted_at is not null
        )
      )
  );
$$;

create policy profiles_read_book_members on profiles
  for select using (shares_book_with(id));

-- ---------------------------------------------------------------------------
-- recipes  (owner full access; public read; book members read)
-- ---------------------------------------------------------------------------
-- Uses the SECURITY DEFINER helper so the book-membership lookup doesn't
-- re-enter book_recipes / book_chapters RLS on every row.
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
  ('avatars', 'avatars', true),
  ('screenshots', 'screenshots', false),
  ('book-exports', 'book-exports', false)
on conflict (id) do nothing;

-- recipe-images: public read; users write within their own uid/ folder.
create policy recipe_images_read on storage.objects
  for select using (bucket_id = 'recipe-images');

-- avatars: public read; users write within their own uid/ folder.
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


-- ===========================================================================
-- 0003 — notes, variants, source_raw (design features)
-- ===========================================================================
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

-- ---------------------------------------------------------------------------
-- recipe_favorites / recipe_cooks  (per-user; own rows only)
-- ---------------------------------------------------------------------------
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
