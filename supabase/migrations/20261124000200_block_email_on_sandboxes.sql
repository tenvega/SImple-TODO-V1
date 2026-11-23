-- TaskFlow is demo-only: every account is an anonymous sandbox.
--
-- Turning the email provider off stops email sign-ups and magic links, but
-- Supabase Auth still accepts `updateUser({ email })` from a signed-in
-- anonymous user and mails a confirmation link to that address. That would
-- let anyone make this project send email to strangers, and would turn a
-- sandbox into a permanent account if the recipient clicked.
--
-- This trigger refuses any attempt to set or change an email address on an
-- existing user. Auth writes the pending address before sending the email,
-- so the request fails and no email goes out.
create function private.block_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.email is distinct from old.email and coalesce(new.email, '') <> '')
     or (new.email_change is distinct from old.email_change and coalesce(new.email_change, '') <> '') then
    raise exception 'Email addresses are disabled: TaskFlow is demo-only'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.block_email_change() from public, anon, authenticated;

create trigger block_email_change
  before update of email, email_change on auth.users
  for each row execute function private.block_email_change();

-- The trigger above keeps the account unchanged, but Auth sends its email
-- before saving. This Send Email hook replaces Auth's mailer: Auth calls it
-- for every email it would send, and it refuses them all, so this project
-- never sends mail. Enabled in supabase/config.toml locally and under
-- Authentication > Auth Hooks on the hosted project.
create function private.reject_auth_email(event jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Email is disabled: TaskFlow is demo-only.'
    )
  );
$$;

-- Only Auth may call it.
grant usage on schema private to supabase_auth_admin;
revoke execute on function private.reject_auth_email(jsonb) from public, anon, authenticated;
grant execute on function private.reject_auth_email(jsonb) to supabase_auth_admin;
