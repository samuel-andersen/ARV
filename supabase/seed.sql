-- Arv — demo seed.
-- Creates one demo user, 5 recipes (4 clean + 1 deliberately messy import that
-- proves the normalization pass has work to do), and 1 demo book.
-- Runs after migrations on `supabase db reset`.

-- ---------------------------------------------------------------------------
-- Demo auth user (profile row is created by the on_auth_user_created trigger)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@arv.kitchen',
  crypt('arvdemo123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Demo Cook"}'
)
on conflict (id) do nothing;

update profiles set plan = 'pro', display_name = 'Demo Cook'
where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
-- 1. Own recipe with a story (the "written in" kind).
insert into recipes (id, owner_id, title, description, story, servings, prep_min, cook_min, source_platform, is_original, normalized)
values (
  'aaaa0001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Grandmother''s Cardamom Buns',
  'Soft, sweet buns scented with freshly ground cardamom.',
  'Mormor baked these every Sunday. The kitchen smelled of cardamom before we were even awake.',
  12, 40, 20, 'manual', true, true
);
insert into ingredients (recipe_id, position, quantity, unit, name, note, needs_review) values
  ('aaaa0001-0000-0000-0000-000000000001', 0, 500, 'g', 'wheat flour', null, false),
  ('aaaa0001-0000-0000-0000-000000000001', 1, 250, 'ml', 'whole milk', 'lukewarm', false),
  ('aaaa0001-0000-0000-0000-000000000001', 2, 100, 'g', 'butter', 'softened', false),
  ('aaaa0001-0000-0000-0000-000000000001', 3, 2, 'tsp', 'ground cardamom', 'freshly ground', false),
  ('aaaa0001-0000-0000-0000-000000000001', 4, 7, 'g', 'dry yeast', null, false);
insert into steps (recipe_id, position, text, timer_seconds) values
  ('aaaa0001-0000-0000-0000-000000000001', 0, 'Warm the milk and dissolve the yeast.', null),
  ('aaaa0001-0000-0000-0000-000000000001', 1, 'Mix in flour, butter and cardamom; knead until smooth.', null),
  ('aaaa0001-0000-0000-0000-000000000001', 2, 'Let the dough rise until doubled.', 3600),
  ('aaaa0001-0000-0000-0000-000000000001', 3, 'Shape into buns and bake at 220°C.', 600);

-- 2. YouTube import (clean, normalized), with attribution.
insert into recipes (id, owner_id, title, description, servings, cook_min, source_platform, source_url, source_author, is_original, normalized)
values (
  'aaaa0002-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Weeknight Miso Butter Pasta',
  'A fast, savory pasta with a glossy miso-butter sauce.',
  4, 20, 'youtube', 'https://youtube.com/watch?v=demo2', '@quickkitchen', false, true
);
insert into ingredients (recipe_id, position, quantity, unit, name, note, needs_review) values
  ('aaaa0002-0000-0000-0000-000000000002', 0, 320, 'g', 'spaghetti', null, false),
  ('aaaa0002-0000-0000-0000-000000000002', 1, 2, 'tbsp', 'white miso', null, false),
  ('aaaa0002-0000-0000-0000-000000000002', 2, 60, 'g', 'butter', null, false),
  ('aaaa0002-0000-0000-0000-000000000002', 3, 2, 'clove', 'garlic', 'finely chopped', false);
insert into steps (recipe_id, position, text, timer_seconds) values
  ('aaaa0002-0000-0000-0000-000000000002', 0, 'Cook the spaghetti until al dente; reserve pasta water.', 540),
  ('aaaa0002-0000-0000-0000-000000000002', 1, 'Melt butter with garlic, whisk in miso and a splash of pasta water.', null),
  ('aaaa0002-0000-0000-0000-000000000002', 2, 'Toss the pasta in the sauce until glossy.', null);

-- 3. Simple text-only recipe (few ingredients — will select a text-only template).
insert into recipes (id, owner_id, title, servings, prep_min, source_platform, is_original, normalized)
values (
  'aaaa0003-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'Three-Ingredient Lemon Dressing', 4, 5, 'manual', true, true
);
insert into ingredients (recipe_id, position, quantity, unit, name, note, needs_review) values
  ('aaaa0003-0000-0000-0000-000000000003', 0, 3, 'tbsp', 'olive oil', null, false),
  ('aaaa0003-0000-0000-0000-000000000003', 1, 1, 'tbsp', 'lemon juice', null, false),
  ('aaaa0003-0000-0000-0000-000000000003', 2, 1, 'tsp', 'honey', null, false);
insert into steps (recipe_id, position, text) values
  ('aaaa0003-0000-0000-0000-000000000003', 0, 'Whisk everything together until emulsified.');

-- 4. Own recipe, longer.
insert into recipes (id, owner_id, title, description, servings, prep_min, cook_min, source_platform, is_original, normalized)
values (
  'aaaa0004-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'Sunday Ragù', 'A slow, unhurried meat sauce for a lazy afternoon.', 6, 30, 180, 'manual', true, true
);
insert into ingredients (recipe_id, position, quantity, unit, name, note, needs_review) values
  ('aaaa0004-0000-0000-0000-000000000004', 0, 500, 'g', 'ground beef', null, false),
  ('aaaa0004-0000-0000-0000-000000000004', 1, 1, null, 'onion', 'finely chopped', false),
  ('aaaa0004-0000-0000-0000-000000000004', 2, 800, 'g', 'canned tomatoes', null, false),
  ('aaaa0004-0000-0000-0000-000000000004', 3, 250, 'ml', 'red wine', null, false);
insert into steps (recipe_id, position, text, timer_seconds) values
  ('aaaa0004-0000-0000-0000-000000000004', 0, 'Brown the beef well; set aside.', null),
  ('aaaa0004-0000-0000-0000-000000000004', 1, 'Soften the onion, deglaze with wine.', null),
  ('aaaa0004-0000-0000-0000-000000000004', 2, 'Add tomatoes and the beef; simmer gently.', 10800);

-- 5. DELIBERATELY MESSY Instagram import — NOT normalized, mixed units and
--    languages, emoji, and needs_review flags. Exists to prove the
--    normalization pass earns its keep.
insert into recipes (id, owner_id, title, description, servings, source_platform, source_url, source_author, is_original, normalized)
values (
  'aaaa0005-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'garlic butter shrimp 🍤🔥 SO GOOD',
  'caption-only import — check quantities',
  4, 'instagram', 'https://instagram.com/p/demo5', '@reels.eats', false, false
);
insert into ingredients (recipe_id, position, quantity, unit, name, note, needs_review) values
  ('aaaa0005-0000-0000-0000-000000000005', 0, 3, 'fedd', 'hvitløk finhakket 🧄', 'mixed language, non-canonical unit', true),
  ('aaaa0005-0000-0000-0000-000000000005', 1, null, null, 'shrimp (a big handful)', 'quantity unknown', true),
  ('aaaa0005-0000-0000-0000-000000000005', 2, 2, 'tbsp', 'butter', null, false),
  ('aaaa0005-0000-0000-0000-000000000005', 3, null, null, 'salt to taste', null, true);
insert into steps (recipe_id, position, text) values
  ('aaaa0005-0000-0000-0000-000000000005', 0, 'melt butter add garlic cook 30 sec then shrimp until pink dont overcook!!'),
  ('aaaa0005-0000-0000-0000-000000000005', 1, 'squeeze lemon serve w bread 🍋🍞');

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
insert into tags (id, name) values
  ('bbbb0001-0000-0000-0000-000000000001', 'baking'),
  ('bbbb0002-0000-0000-0000-000000000002', 'weeknight'),
  ('bbbb0003-0000-0000-0000-000000000003', 'family')
on conflict (name) do nothing;
insert into recipe_tags (recipe_id, tag_id) values
  ('aaaa0001-0000-0000-0000-000000000001', 'bbbb0001-0000-0000-0000-000000000001'),
  ('aaaa0001-0000-0000-0000-000000000001', 'bbbb0003-0000-0000-0000-000000000003'),
  ('aaaa0002-0000-0000-0000-000000000002', 'bbbb0002-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------------
-- Demo book (Editorial style) with two chapters
-- ---------------------------------------------------------------------------
insert into books (id, owner_id, title, subtitle, style, status, dedication)
values (
  'cccc0001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Our Kitchen', 'A first gathering', 'editorial', 'draft',
  'For everyone who ever cooked at this table.'
);
insert into book_chapters (id, book_id, position, title, intro_text) values
  ('dddd0001-0000-0000-0000-000000000001', 'cccc0001-0000-0000-0000-000000000001', 0, 'Mornings', 'How the day begins.'),
  ('dddd0002-0000-0000-0000-000000000002', 'cccc0001-0000-0000-0000-000000000001', 1, 'Suppers', 'The unhurried end of the day.');
insert into book_recipes (chapter_id, recipe_id, position) values
  ('dddd0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 0),
  ('dddd0002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002', 0),
  ('dddd0002-0000-0000-0000-000000000002', 'aaaa0004-0000-0000-0000-000000000004', 1);
