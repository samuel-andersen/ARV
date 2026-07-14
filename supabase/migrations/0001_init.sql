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
  created_at timestamptz not null default now()
);

create index orders_book_idx on orders (book_id, created_at desc);
