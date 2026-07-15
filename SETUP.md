# Deploy Arv — step by step (mobile-friendly)

Everything below can be done from a phone browser. You'll set up a Supabase
database, connect it to your Vercel project, and go live. ~10 minutes.

Arv's code lives on `main`, so a Vercel import of the `main` branch has
everything.

---

## 1. Create the Supabase project

1. Go to **supabase.com** → open the organization you want (a spare/own org
   with a free slot).
2. **New project** → name it `arv`, pick a region near you, set a database
   password (save it somewhere), **Create**. Wait ~1 minute for it to spin up.

## 2. Create the database

1. In the project, open **SQL Editor** (left sidebar) → **New query**.
2. Open **`supabase/setup.sql`** from this repo, copy the whole file, paste it
   into the editor, and press **Run**.
   - This creates every table, all Row-Level-Security policies, and the storage
     buckets. It should finish with "Success".
3. *(Optional)* For 5 demo recipes + 1 demo book, run **`supabase/seed.sql`**
   the same way. Demo login afterwards: `demo@arv.kitchen` / `arvdemo123`.

## 3. Copy the API keys

**Project Settings → API**, copy these three:

- **Project URL** (e.g. `https://abcd.supabase.co`)
- **anon public** key
- **service_role** key (secret — server only)

## 4. Add the environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add (for all
environments):

```
NEXT_PUBLIC_SUPABASE_URL       = https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = <anon public key>
SUPABASE_SERVICE_ROLE_KEY      = <service_role key>
NEXT_PUBLIC_SITE_URL           = https://<your-app>.vercel.app
```

`NEXT_PUBLIC_SITE_URL` is your Vercel domain — set it after the first deploy if
you don't know it yet, then redeploy.

*(Optional, later)* `ANTHROPIC_API_KEY` enables the AI import agent. Without it,
the paste-text import still works via the built-in fallback.

## 5. Point Supabase Auth at your domain

So the email magic link redirects correctly:

**Supabase → Authentication → URL Configuration**

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: add `https://<your-app>.vercel.app/auth/confirm`

## 6. Deploy

In Vercel, **Deploy** (or **Redeploy** if you'd already deployed). When it's
green, open your domain, sign in with your email, and you're live.

---

## Moving to a different Supabase project later

Because there's no real data yet, "moving" is just: create a new project,
re-run `supabase/setup.sql`, and update the four env vars + the Auth Site URL.
Nothing is lost. Once you have real data, use Supabase's **Transfer project**
instead so the data comes along.

## Local development (optional)

```bash
supabase start && supabase db reset   # local Postgres + migrations + seed
cp .env.example .env.local             # fill in the local keys it prints
npm run dev
```
