# 0001: Enforce data isolation in Postgres with Row Level Security

**Status:** accepted · 2026-11-21

## Context

v1 checked ownership in API route code, and it was easy to get wrong: routes
trusted a `userId` sent by the client, and any user could read or change
anyone's tasks. The MongoDB deployment also failed on Vercel.

## Decision

Use Supabase (Postgres + Auth) and make the database the security boundary:

- RLS on every table, with owner-only policies on `(select auth.uid())`.
- `user_id default auth.uid()`; all privileges revoked from `anon`.
- Composite `(id, user_id)` foreign keys so child rows can't point across accounts.
- Server code uses the publishable key and the user's JWT. There's no service-role key in the app.
- Multi-step writes (`save_task`) are `SECURITY INVOKER` functions, so RLS still applies inside them.

## Consequences

- An app bug can show the wrong *view* of a user's own data, but never someone else's.
- Isolation is tested where it's enforced: `tests/db` signs in as real users and attacks the API.
- Aggregations happen in TypeScript over the user's own rows (bounded by quotas) rather than in privileged SQL.
- Admin-style features (support tools, global stats) would need a separate, deliberately privileged path.
