# 0002: Demo with private anonymous sandboxes, not a shared account

**Status:** accepted · 2026-11-21

## Context

v1 shipped a demo login with a committed password, a hard-coded user ID and a
"switch user" feature. Every visitor shared, and could vandalize, the same data.

## Decision

"Try the demo" calls Supabase anonymous sign-in from the browser, so Auth's
per-IP limits see the visitor's real IP. A `seed_sandbox()` SQL function,
running as that user, then fills *their* account with sample tasks and three
weeks of history in their time zone. A `pg_cron` job deletes anonymous
accounts older than 7 days. Visitors can keep their sandbox by adding an
email, which upgrades the same user once the address is confirmed.

## Consequences

- No shared credentials anywhere, and no visitor can affect another.
- Sign-ups and seeds are bounded by the anonymous sign-in rate limit and row quotas.
- A public deployment should add CAPTCHA to anonymous sign-in.
- Email confirmation must stay on; otherwise a visitor could claim someone else's address.
