-- Rename roll_number -> registration_number to match what LICET forms call it.
-- Safe to re-run: only renames when the old column is still present.
do $rename$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'roll_number'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'registration_number'
  ) then
    alter table public.users rename column roll_number to registration_number;
  end if;
end
$rename$;

-- In case 004 was never run on this project.
alter table public.users
  add column if not exists registration_number text;
