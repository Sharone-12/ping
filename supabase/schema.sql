-- LICET Pulse — schema, RLS policies, and demo seed data.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ------------------------------------------------------- collision guard ---
-- This project may be shared with another app. `create table if not exists`
-- would silently skip a name that already belongs to someone else, and the
-- `enable row level security` statements further down would then be applied to
-- THEIR table -- breaking it. Stop before any of that can happen.

do $guard$
declare
  clash text;
begin
  select t.name into clash
  from (values
    ('users',        'onboarded'),
    ('events',       'source_email_id'),
    ('projects',     'ai_summary'),
    ('saved_events', 'event_id'),
    ('event_clicks', 'event_id')
  ) as t(name, marker)
  where to_regclass('public.' || t.name) is not null
    and not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = t.name
        and c.column_name = t.marker
    )
  limit 1;

  if clash is not null then
    raise exception
      'public.% already exists here and is not a LICET Pulse table. This Supabase project looks shared with another app. Use a separate Supabase project, or namespace these tables, before running this script.',
      clash;
  end if;
end
$guard$;

-- ---------------------------------------------------------------- tables ---

-- Mirrors auth.users. Using the auth uid as the primary key (rather than the
-- spec's standalone gen_random_uuid()) is what lets RLS policies compare rows
-- against auth.uid() directly.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  department text,
  year int check (year between 1 and 4),
  interests text[] not null default '{}',
  gmail_connected boolean not null default false,
  -- Populated in phase 3. Supabase returns the provider refresh token exactly
  -- once, at sign-in, so it is captured in the auth callback.
  gmail_access_token text,
  gmail_refresh_token text,
  gmail_token_expires_at timestamptz,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'other'
    check (event_type in ('hackathon','workshop','seminar','fest',
                          'competition','guest-lecture','other')),
  department text,
  date_start timestamptz,
  date_end timestamptz,
  registration_deadline timestamptz,
  venue text,
  registration_link text,
  poster_url text,
  tags text[] not null default '{}',
  team_size text,
  source_email_id text unique,
  created_by uuid references public.users (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  title text not null,
  description text,
  ai_summary text,
  tech_stack text[] not null default '{}',
  tags text[] not null default '{}',
  looking_for text[] not null default '{}',
  github_url text,
  demo_url text,
  image_url text,
  status text not null default 'active'
    check (status in ('active','completed','looking-for-team')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  reminded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.event_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  clicked_at timestamptz not null default now()
);

create index if not exists events_date_start_idx on public.events (date_start);
create index if not exists events_type_idx on public.events (event_type);
create index if not exists saved_events_user_idx on public.saved_events (user_id);
create index if not exists projects_created_idx on public.projects (created_at desc);

-- ------------------------------------------------------------------- rls ---
-- The publishable key ships to the browser, so every table needs policies.

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.projects enable row level security;
alter table public.saved_events enable row level security;
alter table public.event_clicks enable row level security;

drop policy if exists "users read own row" on public.users;
create policy "users read own row" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users insert own row" on public.users;
create policy "users insert own row" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users update own row" on public.users;
create policy "users update own row" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Events are campus-wide: anyone signed in can read them, but only the
-- server (service/secret key, which bypasses RLS) writes them.
drop policy if exists "events readable by authenticated" on public.events;
create policy "events readable by authenticated" on public.events
  for select to authenticated using (true);

drop policy if exists "projects readable by authenticated" on public.projects;
create policy "projects readable by authenticated" on public.projects
  for select to authenticated using (true);

drop policy if exists "projects written by owner" on public.projects;
create policy "projects written by owner" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved events owned" on public.saved_events;
create policy "saved events owned" on public.saved_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "event clicks owned" on public.event_clicks;
create policy "event clicks owned" on public.event_clicks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --------------------------------------------------------------- triggers ---

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();
