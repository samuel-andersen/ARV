# Arv

**From scroll to shelf.** A source-to-print system for recipe books — personal
and permanent. Capture recipes from social media and your own kitchen, structure
them into a clean digital cookbook, and turn the collection into a
professionally designed, printed hardcover.

> **Arv** is Norwegian for *inheritance*. Everything digital disappears; Arv
> builds for the shelf, not the feed.

---

## Status: foundation

This repository currently contains the **foundation** — the skeleton every
feature is built on. It compiles, encodes the design system, and defines the
full data model and the seams for external services. Feature surfaces (import
agent, book builder UI, sharing) build on top of this.

**In place now**

- Next.js 15 (App Router, TypeScript) scaffold, installable PWA manifest with
  the **Share → Arv** share-target seam.
- **Arv Design System v1.0** as the single source of truth — TypeScript tokens
  (`lib/design/tokens.ts`) mirrored into Tailwind v4 CSS tokens
  (`app/globals.css`). One hue, seven values, fixed roles; Inter 300/400/500;
  zero radius; hairlines, not shadows.
- Complete **Supabase schema** (`supabase/migrations/`) with **RLS on every
  table**, storage buckets, and a seed (`supabase/seed.sql`) of 5 recipes + 1
  book — including one deliberately messy import that proves the normalization
  pass has work to do.
- Shared **Zod schemas** (`lib/schemas/`) used across extraction, forms, and DB.
- Typed **provider interfaces** with retries/timeouts/failover
  (`lib/providers/`): `MediaFetchProvider`, `TranscriptionProvider`,
  `PrintProvider` — all shipping stubs, real adapters slot in later.
- Deterministic **book template auto-selection** (`lib/book/template-selection.ts`)
  — the rule that keeps a user from ever making an ugly page, incl. the image
  quality defense.

**Not yet built** (clean seams left in place): auth surface, import pipeline,
library, book builder UI, PDF generation, sharing, billing.

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
