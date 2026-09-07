-- Tracks when a user's inbox was last read, so login can auto-sync without
-- re-reading everything on every page load.
alter table public.users
  add column if not exists last_synced_at timestamptz;
