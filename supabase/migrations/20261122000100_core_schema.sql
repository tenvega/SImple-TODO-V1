-- TaskFlow core schema.
--
-- Security model: every table carries a user_id that defaults to auth.uid(),
-- has Row Level Security enabled, and only exposes rows to their owner.
-- The app never sends a user_id; Postgres derives it from the session JWT.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.task_priority as enum ('none', 'low', 'medium', 'high');
create type public.focus_kind as enum ('work', 'short_break', 'long_break');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created by trigger)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text check (char_length(notes) <= 5000),
  due_at timestamptz,
  priority public.task_priority not null default 'none',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets child tables prove a referenced task has the same owner.
  unique (id, user_id)
);

create index tasks_user_open_idx on public.tasks (user_id, due_at) where completed_at is null;
create index tasks_user_completed_idx on public.tasks (user_id, completed_at) where completed_at is not null;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tags (per user, lowercase slugs)
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9][a-z0-9_-]{0,31}$'),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- Composite foreign keys mean a task and a tag can only be linked when both
-- belong to the same user, even if a policy were ever written too loosely.
create table public.task_tags (
  task_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null default auth.uid(),
  primary key (task_id, tag_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.tags (id, user_id) on delete cascade
);

create index task_tags_tag_idx on public.task_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Focus sessions (Pomodoro history)
-- ---------------------------------------------------------------------------
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid,
  kind public.focus_kind not null default 'work',
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 1 and 7200),
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  check (ended_at > started_at),
  -- Deleting a task keeps its focus history but forgets the link.
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete set null (task_id)
);

create index focus_sessions_user_started_idx on public.focus_sessions (user_id, started_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.focus_sessions enable row level security;

-- Signed-out visitors (the anon role) get nothing at all.
revoke all on public.profiles, public.tasks, public.tags, public.task_tags, public.focus_sessions from anon;

-- Profiles: read and rename your own; rows are created/deleted with the auth user.
create policy "profiles: owner can read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: owner can update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, delete on public.profiles from authenticated;

-- Owner-only CRUD for the remaining tables. `with check` stops a row from
-- being written with, or moved to, someone else's user_id.
create policy "tasks: owner can read" on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks: owner can insert" on public.tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tasks: owner can update" on public.tasks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tasks: owner can delete" on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "tags: owner can read" on public.tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tags: owner can insert" on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tags: owner can update" on public.tags
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tags: owner can delete" on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "task_tags: owner can read" on public.task_tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy "task_tags: owner can insert" on public.task_tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "task_tags: owner can delete" on public.task_tags
  for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.task_tags from authenticated;

create policy "focus_sessions: owner can read" on public.focus_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "focus_sessions: owner can insert" on public.focus_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "focus_sessions: owner can delete" on public.focus_sessions
  for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.focus_sessions from authenticated;

-- ---------------------------------------------------------------------------
-- Abuse limits: cap rows per user so one account can't fill the database.
-- ---------------------------------------------------------------------------
create function public.enforce_row_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quota integer := tg_argv[0]::integer;
  current_count integer;
begin
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into current_count
    using new.user_id;
  if current_count >= quota then
    raise exception 'Limit reached: at most % rows in %', quota, tg_table_name
      using errcode = 'P0001', hint = 'quota_exceeded';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_row_quota() from public, anon, authenticated;

create trigger tasks_quota before insert on public.tasks
  for each row execute function public.enforce_row_quota('2000');
create trigger tags_quota before insert on public.tags
  for each row execute function public.enforce_row_quota('200');
create trigger focus_sessions_quota before insert on public.focus_sessions
  for each row execute function public.enforce_row_quota('5000');
