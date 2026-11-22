-- Demo sandbox seeding.
--
-- "Try the demo" signs the visitor in anonymously, then calls seed_sandbox().
-- The function runs as the caller (security invoker), so Row Level Security
-- still applies: it can only ever write rows owned by auth.uid().
-- Dates are relative to "today" in the visitor's time zone so the sample
-- data always looks current. The same function seeds local test users in
-- supabase/seed.sql, so there is one source of sample data.

create function public.seed_sandbox(p_time_zone text default 'UTC')
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  tz text := 'UTC';
  today date;
  mix_stems uuid;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Only seed an empty account; calling it twice is a no-op.
  if exists (select 1 from public.tasks where user_id = uid) then
    return;
  end if;

  if exists (select 1 from pg_catalog.pg_timezone_names where name = p_time_zone) then
    tz := p_time_zone;
  end if;
  today := (now() at time zone tz)::date;

  insert into public.tags (name)
  values ('personal'), ('work'), ('studio'), ('errands');

  -- Open and upcoming tasks, plus this morning's completed one.
  with src (title, notes, due, priority, completed, tag) as (
    values
      ('Renew passport photos', null, ((today - 2) + time '17:00') at time zone tz, 'medium', null::timestamptz, 'personal'),
      ('Review PR: session middleware', 'Check that every route reads the user from the session cookie, never from the request body.', (today + time '11:00') at time zone tz, 'high', null, 'work'),
      ('Call Danielle about the venue', 'Confirm Saturday load-in time and ask about the PA rental.', (today + time '15:00') at time zone tz, 'high', null, 'work'),
      ('Mix stems for trailer cue', null, (today + time '18:00') at time zone tz, 'medium', null, 'studio'),
      ('Pick up dry cleaning', null, (today + time '19:00') at time zone tz, 'low', null, 'errands'),
      ('Morning run', null, (today + time '07:00') at time zone tz, 'none', (today + time '07:42') at time zone tz, 'personal'),
      ('Send invoice to Northlight Studio', null, ((today + 1) + time '10:00') at time zone tz, 'medium', null, 'work'),
      ('Foley session: footsteps on gravel', 'Bring the contact mic and two pairs of boots.', ((today + 2) + time '14:00') at time zone tz, 'high', null, 'studio'),
      ('Book dentist appointment', null, ((today + 3) + time '09:00') at time zone tz, 'low', null, 'personal'),
      ('Back up sample library', null, ((today + 5) + time '20:00') at time zone tz, 'medium', null, 'studio'),
      ('Plan weekend hike', null, ((today + 6) + time '12:00') at time zone tz, 'none', null, 'personal'),
      ('Draft Q1 goals', null, ((today + 8) + time '10:00') at time zone tz, 'medium', null, 'work'),
      ('Clean up downloads folder', null, null, 'low', null, 'personal')
  ),
  ins as (
    insert into public.tasks (title, notes, due_at, priority, completed_at)
    select title, notes, due, priority::public.task_priority, completed from src
    returning id, title
  )
  insert into public.task_tags (task_id, tag_id)
  select ins.id, tg.id
  from ins
  join src using (title)
  join public.tags tg on tg.name = src.tag and tg.user_id = uid;

  select id into mix_stems from public.tasks where user_id = uid and title = 'Mix stems for trailer cue';

  -- Three weeks of completed history: 0-4 tasks a day in a repeating pattern.
  with pool (n, title, tag, priority) as (
    values
      (0, 'Reply to client feedback', 'work', 'high'),
      (1, 'Bounce rough mix for review', 'studio', 'medium'),
      (2, 'Grocery run', 'errands', 'low'),
      (3, 'Update portfolio reel', 'work', 'medium'),
      (4, 'Water the plants', 'personal', 'none'),
      (5, 'Label field recordings', 'studio', 'low'),
      (6, 'Weekly planning', 'work', 'medium'),
      (7, 'Call the bank', 'errands', 'medium'),
      (8, 'Restring the guitar', 'personal', 'low'),
      (9, 'Render ambience loops', 'studio', 'high'),
      (10, 'Expense report', 'work', 'low'),
      (11, 'Return library books', 'errands', 'none')
  ),
  slots as (
    select d, k, ((d * 5 + k * 7) % 12) as n
    from generate_series(1, 21) as d
    cross join lateral generate_series(1, (d * 7 + 3) % 5) as k
  ),
  ins as (
    insert into public.tasks (title, priority, due_at, completed_at, created_at)
    select
      p.title,
      p.priority::public.task_priority,
      ((today - s.d) + time '17:00') at time zone tz,
      ((today - s.d) + time '09:00' + make_interval(hours => s.k * 2, mins => (s.n * 7) % 50)) at time zone tz,
      ((today - s.d - 1) + time '20:00') at time zone tz
    from slots s
    join pool p on p.n = s.n
    returning id, title
  )
  insert into public.task_tags (task_id, tag_id)
  select distinct ins.id, tg.id
  from ins
  join pool p on p.title = ins.title
  join public.tags tg on tg.name = p.tag and tg.user_id = uid;

  -- Focus history: 25-minute work sessions on most days, plus two this morning.
  insert into public.focus_sessions (kind, started_at, ended_at, duration_seconds, task_id)
  select
    'work',
    ((today - d) + time '09:30' + make_interval(mins => k * 35)) at time zone tz,
    ((today - d) + time '09:55' + make_interval(mins => k * 35)) at time zone tz,
    1500,
    case when d = 0 then mix_stems end
  from generate_series(0, 20) as d
  cross join lateral generate_series(0, case when d = 0 then 1 else (d * 3) % 4 end) as k
  where (d = 0 or extract(isodow from today - d) < 7)
    and (((today - d) + time '09:55' + make_interval(mins => k * 35)) at time zone tz) <= now();
end;
$$;

revoke execute on function public.seed_sandbox(text) from public, anon;
grant execute on function public.seed_sandbox(text) to authenticated;
