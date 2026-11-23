-- Intentionally empty.
-- Sample data comes from public.seed_sandbox(), which the app calls after an
-- anonymous sign-in and the tests call for their own throwaway users.

-- Local stack only (db push never runs this file): lift the hourly cap on new
-- demo sandboxes so repeated test runs aren't refused. Production keeps 120.
insert into private.settings (key, value) values ('max_sandboxes_per_hour', '100000');
