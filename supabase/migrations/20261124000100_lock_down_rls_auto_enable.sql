-- Hosted projects created with "Enable RLS on new tables automatically" get a
-- SECURITY DEFINER helper, public.rls_auto_enable(), run by an event trigger
-- whenever a table is created. Postgres grants EXECUTE to everyone by default,
-- so it's also reachable at /rest/v1/rpc/rls_auto_enable. A direct call fails
-- (it only works inside an event trigger), but nothing should be callable
-- through the API that doesn't need to be. The event trigger keeps working:
-- event triggers don't check EXECUTE privileges.
--
-- The helper doesn't exist on the local stack, so this only acts if it's there.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
