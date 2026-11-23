-- Limits sized for a demo on Supabase's free plan (500 MB database).
--
-- Before this, one IP could create 30 sandboxes an hour, each holding up to
-- 2,000 tasks with 5,000-character notes (about 10 MB). That's ~300 MB an
-- hour: enough to fill the free database in under two hours. A seeded
-- sandbox uses 53 tasks, 4 tags and 43 focus sessions, so these limits leave
-- plenty of room to play while keeping the worst case near 1 MB per sandbox.

-- 1. Smaller per-sandbox quotas (enforce_row_quota is in the core schema).
drop trigger tasks_quota on public.tasks;
drop trigger tags_quota on public.tags;
drop trigger focus_sessions_quota on public.focus_sessions;

create trigger tasks_quota before insert on public.tasks
  for each row execute function public.enforce_row_quota('300');
create trigger tags_quota before insert on public.tags
  for each row execute function public.enforce_row_quota('50');
create trigger focus_sessions_quota before insert on public.focus_sessions
  for each row execute function public.enforce_row_quota('1500');

-- 2. Shorter notes: 2,000 characters is still a long note.
alter table public.tasks drop constraint tasks_notes_check;
alter table public.tasks add constraint tasks_notes_check check (char_length(notes) <= 2000);

-- 3. A circuit breaker on new sandboxes, across all visitors. Supabase's
-- per-IP limit (30 an hour) doesn't stop many IPs at once, so this refuses
-- new sandboxes when the database is getting full or sign-ups spike.
-- Existing sandboxes keep working, and the nightly cleanup frees space.
-- Overrides for the limits below. Empty in production; the local stack sets
-- a higher hourly cap in supabase/seed.sql so test runs aren't refused. In
-- the private schema, so the API can't read or change it.
create table private.settings (
  key text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

create function private.guard_new_sandbox()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Free plan: 500 MB. Stop well before it.
  max_bytes constant bigint := 400 * 1024 * 1024;
  max_per_hour constant integer := coalesce(
    (select value::integer from private.settings where key = 'max_sandboxes_per_hour'),
    120
  );
begin
  if not new.is_anonymous then
    return new;
  end if;
  if pg_catalog.pg_database_size(pg_catalog.current_database()) > max_bytes then
    raise exception 'The demo is full right now'
      using errcode = 'P0001', hint = 'demo_full';
  end if;
  if (select count(*) from auth.users
      where is_anonymous and created_at > now() - interval '1 hour') >= max_per_hour then
    raise exception 'Too many new demo sandboxes this hour'
      using errcode = 'P0001', hint = 'demo_busy';
  end if;
  return new;
end;
$$;

revoke execute on function private.guard_new_sandbox() from public, anon, authenticated;

create trigger guard_new_sandbox
  before insert on auth.users
  for each row execute function private.guard_new_sandbox();
