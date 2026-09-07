# LICET Pulse

AI-powered campus event discovery for LICET. This repo currently contains
**phase 1: the UI shell and Google authentication.** No Groq, Gmail parsing, or
AI search is wired up yet — see "Not built yet" below.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment** — `.env.local` is already generated from the repo's `.env`.
   See `.env.example` for the shape. `SUPABASE_SECRET_KEY` is server-only and
   must never gain a `NEXT_PUBLIC_` prefix.

3. **Database** — use a Supabase project dedicated to LICET Pulse.

   Sharing a project with another app is not safe here: `auth.users` is
   per-project (so both apps share one user pool), and `schema.sql` enables RLS
   on `users`, `events`, and `projects` — generic names. If another app already
   owns one of those, enabling RLS on it would break that app. `schema.sql`
   opens with a guard that aborts if it finds a table it does not recognise,
   but a separate project is the actual fix.

   In the Supabase dashboard (SQL Editor → New query), run:

   - `supabase/schema.sql` — tables, RLS policies, triggers
   - `supabase/seed.sql` — 15 demo events

   Until these run, the feed falls back to the bundled seed in
   `lib/seed-events.ts` and shows a banner saying so. Save/unsave needs the real
   rows, so it stays inert until `seed.sql` has been applied.

4. **Google OAuth** — prefer a Google Cloud project dedicated to LICET Pulse.
   The OAuth consent screen is per *Google Cloud project*, not per client, so
   adding the restricted `gmail.readonly` scope to a shared consent screen makes
   every other app on that project show the "unverified app" warning and request
   Gmail access it does not need.

   In Supabase → Authentication → Providers → Google, add the client ID and
   secret from Google Cloud. Then:

   - Google Cloud → Credentials → your OAuth client → Authorised redirect URIs:
     `https://<project>.supabase.co/auth/v1/callback`
   - Google Cloud → OAuth consent screen → add the
     `https://www.googleapis.com/auth/gmail.readonly` scope, and add every demo
     account under **Test users** (the scope is restricted, so unverified apps
     only work for listed test users).
   - Supabase → Authentication → URL Configuration → Redirect URLs:
     `http://localhost:3000/auth/callback` and your deployed equivalent.

5. **Run**

   ```bash
   npm run dev
   ```

## Auth flow

Login and Gmail access are deliberately separate.

**Login** requests only `email`/`profile` — non-sensitive scopes, so any Google
account can sign in with no consent warning and no test-user list.
`/` → Google → `/auth/callback` exchanges the code and upserts `public.users` →
`/onboarding` on first login, `/feed` afterwards.

**Connect Gmail** is an opt-in button on `/profile` that runs a second OAuth
request carrying `gmail.readonly` with `access_type=offline&prompt=consent`.
That is a Google *restricted* scope: until the app passes OAuth verification
plus a CASA security assessment, only accounts added under Test users in the
Google Cloud consent screen can grant it. Bundling it into login would gate
every user behind that list.

The callback checks the granted scopes against Google's tokeninfo endpoint
before setting `gmail_connected`, because a plain login also returns a
`provider_token` and its presence alone proves nothing about Gmail.

Note: while the app stays in Testing status, Google-issued refresh tokens
expire after 7 days, so Gmail will need periodic reconnection.

Route protection is layered: `middleware.ts` redirects anonymous requests to `/`
with a `next` param, and `app/(app)/layout.tsx` re-checks server-side.

## Structure

```
app/
  page.tsx              landing (public)
  onboarding/           first-login department / year / interests
  auth/callback/        OAuth code exchange + profile upsert
  auth/signout/
  actions/              server actions (save event, save profile)
  (app)/                signed-in shell: TopBar + BottomNav
    feed/  search/  projects/  profile/  events/[id]/
components/             EventCard, ProjectCard, SearchBar, FilterPills, …
lib/                    supabase clients, data access, seed data, utils
supabase/               schema.sql, seed.sql
```

## Design

Warm monochrome cream, one terracotta accent, no dark theme. Tokens live in
`tailwind.config.ts`: `cream`, `ink`, `line`, `clay` (accent), `coral`
(deadlines), `sage` (success).

## Features

**Event feed** — parsed from Gmail, split into Happening this week / Upcoming /
Recently ended (last 7 days). "For You" *ranks* by relevance and never hides an
event; only the type pills filter.

**Email sync** — Gmail search (60 days, paginated, capped at 400) → regex
prefilter that drops course material before it costs a token → Groq extraction
at concurrency 4 with 429 backoff → upsert on a normalised `dedup_key`. Already
seen mail is skipped via `processed_emails`. Streams progress over SSE.
Auto-runs on feed load at most every 30 minutes (enforced server-side); the
Profile button forces a run.

**AI search** — natural-language questions answered by Groq over every event.
Returned ids are intersected with what was actually sent, so the model cannot
invent results.

**Registration agent** — reads a Google Form's fields, maps them to your profile
with Groq, previews everything for you to check, then opens a *pre-filled* form.
You press Submit on Google's own page; the app never submits for you. Payment
forms, file uploads, closed forms and sign-in walls each fall back to opening
the form manually.

**Projects** — publish a project and Groq writes the summary and tags. "For me"
ranks by overlap with your interests.

**Calendar** — Google Calendar template links, no Calendar API scope needed.

## Scheduled sync

`/api/cron/sync` reads every connected inbox so the feed is already current
when anyone arrives. Events are campus-wide, so one account syncing keeps the
feed fresh for everyone. `vercel.json` schedules it every 2 hours. Set
`CRON_SECRET` in both `.env.local` and Vercel — without it the endpoint refuses
to run. Cron only fires on a deployment, not on localhost.

## Migrations

Run in order in the Supabase SQL editor:

1. `supabase/schema.sql` — tables, RLS, triggers
2. `supabase/migrations/002_email_sync.sql` — `processed_emails`, `dedup_key`
3. `supabase/migrations/003_auto_sync.sql` — `last_synced_at`
4. `supabase/migrations/004_agent.sql` — `phone` / `roll_number` / `section`,
   `event_registrations`

## Not built yet

Admin dashboard, Telegram bot, push notifications. The agent's Google Form
extraction has not been validated against a live open form — both test forms
were closed, so its `FB_PUBLIC_LOAD_DATA_` index paths are verified only
against a synthetic payload. It degrades to "open the form yourself" if the
shape differs.
