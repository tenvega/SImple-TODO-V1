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
accounts older than 7 days.

**Update (2.1.0):** TaskFlow is now demo-only. The original version let
visitors keep a sandbox by adding an email; that was removed so the project
holds no personal data and needs no mail service. Email is switched off in
Auth, a Send Email hook refuses every message, and a trigger stops any
account from gaining an email address.

## Consequences

- No shared credentials anywhere, and no visitor can affect another.
- Sign-ups and seeds are bounded by the anonymous sign-in rate limit and row quotas.
- A public deployment should add CAPTCHA to anonymous sign-in.
- Nobody can keep their data past 7 days. For a portfolio demo that's the point.
- Turning the email provider off isn't enough on its own: Auth would still
  email an address passed to `updateUser`. The Send Email hook closes that.
