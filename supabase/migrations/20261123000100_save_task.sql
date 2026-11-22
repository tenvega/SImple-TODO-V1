-- Tasks stage: all-day due dates and one atomic call to create or edit a task.

-- A due date can be a day ("Friday") or a moment ("Friday 3pm"). All-day
-- tasks store the start of that day in the user's time zone.
alter table public.tasks
  add column due_has_time boolean not null default true;

-- Creates a task (no p_id) or edits one, and replaces its tags, in one
-- transaction. SECURITY INVOKER: every statement runs as the caller, so Row
-- Level Security still decides which rows exist. Editing someone else's task
-- finds no row and raises, and the composite foreign keys on task_tags stop
-- a tag from ever linking across accounts.
create function public.save_task(
  p_title text,
  p_priority public.task_priority default 'none',
  p_due_at timestamptz default null,
  p_due_has_time boolean default true,
  p_notes text default null,
  p_tags text[] default '{}',
  p_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  tag_names text[] := array(select distinct lower(btrim(n)) from unnest(coalesce(p_tags, '{}')) as n);
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if cardinality(tag_names) > 10 then
    raise exception 'A task can have at most 10 tags' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.tasks (title, notes, due_at, due_has_time, priority)
    values (btrim(p_title), nullif(btrim(p_notes), ''), p_due_at, coalesce(p_due_has_time, true), p_priority)
    returning id into v_id;
  else
    update public.tasks
    set title = btrim(p_title),
        notes = nullif(btrim(p_notes), ''),
        due_at = p_due_at,
        due_has_time = coalesce(p_due_has_time, true),
        priority = p_priority
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Task not found' using errcode = 'P0002';
    end if;
  end if;

  -- Tag names are validated by the check constraint on public.tags.
  insert into public.tags (name)
  select n from unnest(tag_names) as n
  on conflict (user_id, name) do nothing;

  delete from public.task_tags tt
  using public.tags t
  where tt.task_id = v_id
    and t.id = tt.tag_id
    and not (t.name = any (tag_names));

  insert into public.task_tags (task_id, tag_id)
  select v_id, t.id
  from public.tags t
  where t.user_id = auth.uid()
    and t.name = any (tag_names)
  on conflict do nothing;

  return v_id;
end;
$$;

revoke execute on function public.save_task(text, public.task_priority, timestamptz, boolean, text, text[], uuid) from public, anon;
grant execute on function public.save_task(text, public.task_priority, timestamptz, boolean, text, text[], uuid) to authenticated;
