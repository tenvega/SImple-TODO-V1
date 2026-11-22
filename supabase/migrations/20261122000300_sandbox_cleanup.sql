-- Scheduled cleanup of old demo sandboxes.
--
-- Anonymous users older than 7 days are deleted once a day. Their tasks,
-- tags and focus sessions go with them through ON DELETE CASCADE.
-- The function lives in a private schema that the Data API does not expose.

create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.delete_stale_sandboxes(max_age interval default interval '7 days')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from auth.users
  where is_anonymous
    and created_at < now() - max_age;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function private.delete_stale_sandboxes(interval) from public, anon, authenticated;

select cron.schedule(
  'delete-stale-sandboxes',
  '17 3 * * *',
  $$select private.delete_stale_sandboxes()$$
);
