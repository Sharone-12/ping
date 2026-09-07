-- Phase 3: email sync support. Run after schema.sql.

-- Every Gmail message we have already looked at, so a re-sync costs no LLM
-- calls for mail we've seen. Keyed per user because inboxes are per user.
create table if not exists public.processed_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  gmail_message_id text not null,
  is_event boolean not null default false,
  event_id uuid references public.events (id) on delete set null,
  processed_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create index if not exists processed_emails_user_idx
  on public.processed_emails (user_id);

alter table public.processed_emails enable row level security;

drop policy if exists "processed emails owned" on public.processed_emails;
create policy "processed emails owned" on public.processed_emails
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dedup key for events parsed out of different emails describing one event.
alter table public.events
  add column if not exists dedup_key text;

create unique index if not exists events_dedup_key_idx
  on public.events (dedup_key);
