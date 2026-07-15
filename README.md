# Arv

**From scroll to shelf.** A source-to-print system for recipe books — personal
and permanent. Capture recipes from social media and your own kitchen, structure
them into a clean digital cookbook, and turn the collection into a
professionally designed, printed hardcover.

> **Arv** is Norwegian for *inheritance*. Everything digital disappears; Arv
> builds for the shelf, not the feed.

---

## Status: core loop working end-to-end

The **manual recipe → book builder → print-ready PDF** loop runs end-to-end with
**zero external dependencies** (no AI/print keys needed) — the slice that proves
the product. On top of the foundation (design system, data model, provider
seams), the following now works:

**Foundation**

- Next.js 15 (App Router, TypeScript) scaffold, installable PWA manifest with
  the **Share → Arv** share-target seam.
- **Arv Design System v1.0** as the single source of truth — TypeScript tokens
  (`lib/design/tokens.ts`) mirrored into Tailwind v4 CSS tokens
  (`app/globals.css`). One hue, seven values, fixed roles; Inter 300/400/500;
  zero radius; hairlines, not shadows; no italics.
- Complete **Supabase schema** (`supabase/migrations/`) with **RLS on every
  table**, storage buckets, and a seed of 5 recipes + 1 book — including one
  deliberately messy import that proves the normalization pass has work to do.
- Shared **Zod schemas** (`lib/schemas/`) across extraction, forms, and DB.
- Typed **provider interfaces** with retries/timeouts/failover
  (`lib/providers/`): `MediaFetchProvider`, `TranscriptionProvider`,
  `PrintProvider` — stubs for now, real adapters slot in later.

**Core loop**

- **Auth**: email magic link (`/login`, `/auth/confirm`), Google OAuth callback
  seam, session middleware, sign-out; onboarding ("Who are you collecting for?").
- **Recipes**: manual create/edit with a **story** field, dynamic
  ingredients/steps; **library** with search; recipe page with a **servings
  scaler**, step **timers**, and imported-recipe **attribution**.
- **Book builder**: create a book (Editorial style), chapters, add/reorder
  recipes, **auto template selection** with valid-only overrides, cover +
  dedication, **preflight** (24–200 page bounds), and a **live spread preview**.
- **Deterministic page model** (`lib/book/layout.ts`) shared by the preview and
  the PDF, so the same content always produces the same pages (snapshot-testable).
- **Print-ready PDF** (`/api/books/[id]/pdf`) via `@react-pdf/renderer` — the
  Editorial style at 20×25 cm with embedded Fraunces/Inter (vendored under
  `assets/fonts/`). Verify the pipeline without a DB: `npx tsx scripts/verify-pdf.ts`.

**Import agent (core engine 1)**

- Layered pipeline (`lib/import/`): **Fetch** (`SourceAdapter` per platform —
  generic-web via JSON-LD then readability, YouTube via oEmbed, IG/TikTok via
  the `MediaFetchProvider` seam) → **Understand** → **Normalize**.
- **Understand** and **Normalize** run behind typed providers
  (`lib/providers/extraction.ts`, `normalization.ts`). With `ANTHROPIC_API_KEY`
  set they use a `claude-opus-4-8` structured-output call; **with no key**, a
  deterministic heuristic extractor + rule-based normalizer keep the paste-text
  path fully working (unit canonicalization `fedd → clove`, `needs_review`
  flags, timer extraction, emoji/chatter stripping).
- Import UI (`/import`): paste a link or paste text → editable **Review** step
  (reuses the recipe form) with honest fallback messaging and attribution kept
  → **Save to your Arv**. PWA **share-target** (`/import/share`) wired.
- Freemium gate (free = 10 imports) enforced in the import action.
- Verify the key-free path: `npx tsx --tsconfig scripts/tsconfig.json scripts/verify-import.ts`.

**Sharing (core engine 3 — "del gleden")**

- **Public recipe pages** (owner opt-in): a share toggle mints a stable slug;
  `/r/[slug]` is a beautiful typeset, anon-readable landing page with
  attribution intact and a "Save to your Arv" CTA — the viral loop. RLS allows
  public read only when `is_public = true`.
- **OG share cards**: `/r/[slug]/opengraph-image` renders a clean card (title +
  "via …" + wordmark) via `next/og` with the vendored Fraunces/Inter fonts, so
  shares look intentional in iMessage/WhatsApp/Stories.
- **Contributor books**: owners invite by email; invitees accept from `/invites`
  and add their own recipes to the shared book. Owner-only controls are gated in
  the builder; contributors manage only their own placements (RLS-enforced).

**Not yet built** (clean seams left in place): the See/Listen layers (ffmpeg
frame sampling + Whisper transcription — interfaces exist), async job queue +
Realtime status, contributor story/signature fields on shared recipes,
Rustic/Minimal styles, live fulfillment, and billing.

> **Note on typing:** the Supabase clients are currently untyped (results are
> shaped into explicit types in `lib/data/*`). After `npm run db:types`
> generates `Database` types from a live schema, add the `<Database>` generic
> back to the clients in `lib/supabase/` to restore end-to-end typing.

---

## Tech stack

- **Next.js 15** (App Router, Server Components/Actions) on **Vercel**, PWA
- **Supabase**: Postgres, Auth (magic link + Google), Storage, RLS, Realtime
- **Tailwind CSS v4** + a small hand-built primitive set (Arv Design System)
- **Anthropic API** (multimodal extraction + normalization) — import phase
- **Whisper** behind `TranscriptionProvider` — import phase
- **Zod** everywhere; Server Components + Server Actions by default

## Getting started

### 1. Install

```bash
npm install
```

### 2. Supabase (local)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase start          # boots local Postgres + Auth + Storage
supabase db reset       # applies migrations + seed
```

Copy the printed anon/service keys into `.env.local`:

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY
```

Regenerate DB types after schema changes:

```bash
npm run db:types
```

### 3. Run

```bash
npm run dev             # http://localhost:3000
npm run typecheck       # tsc --noEmit
npm run build           # production build
```

Demo login (after `db reset`): `demo@arv.kitchen` / `arvdemo123`.

## Deploy

Deploys to **Vercel**. Set the same environment variables from `.env.example`
in the Vercel project (use the hosted Supabase project's URL/keys). The build
command is `next build`; no extra configuration is required.

## Project layout

```
app/                     App Router routes + global styles
components/ui/           Hand-built Arv primitives (Button, Eyebrow)
lib/design/tokens.ts     Design System source of truth (JS-consumable)
lib/schemas/             Shared Zod schemas (extraction / forms / DB)
lib/providers/           Typed external-service seams (media/transcription/print)
lib/book/                Book-builder logic (template auto-selection)
lib/supabase/            Typed Supabase clients (browser/server/middleware)
supabase/migrations/     Schema + RLS
supabase/seed.sql        Demo data
```

## Design system (the law)

One hue (green), seven values, fixed roles. **Gran `#49604F` is the only
interactive color.** Salvie is a light accent surface (never a button). Stone
never sits on Salvie (fails contrast). Inter only in app chrome — 300 for
display, 400 body, 500 labels. Zero border-radius, no shadows or gradients;
structure is drawn with 1px hairlines. Book pages are the deliberate
exception, where themes may use a serif. Full tokens live in
`lib/design/tokens.ts`.
