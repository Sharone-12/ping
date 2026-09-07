-- Phase 4: auto-registration agent.

-- Fields that appear on nearly every college registration form. Collected once
-- during onboarding, reused for every future registration.
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists roll_number text;
alter table public.users add column if not exists section text;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status text not null default 'registered'
    check (status in ('registered', 'attended', 'cancelled')),
  registered_via text not null default 'agent'
    check (registered_via in ('agent', 'manual')),
  xp_awarded int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index if not exists event_registrations_user_idx
  on public.event_registrations (user_id);

alter table public.event_registrations enable row level security;

drop policy if exists "registrations owned" on public.event_registrations;
create policy "registrations owned" on public.event_registrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
