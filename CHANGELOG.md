# Changelog

## 2.0.0 (unreleased)

A ground-up rebuild focused on security, with a new design.

### Added

- Supabase (Postgres + Auth) with Row Level Security on every table, composite
  ownership keys and per-account quotas.
- Private anonymous demo sandboxes with seeded history, automatic cleanup and
  an upgrade to an email account.
- Passwordless sign-in by email magic link.
- Today, Upcoming, All and Completed views with natural-language quick add,
  a details sheet, optimistic updates and ⌘K search.
- Focus: a Pomodoro ring timer with presets, full-screen mode, chimes and
  session logging that survives reloads.
- Insights: weekly and monthly cards, a daily chart and a plain-language summary.
- Monochrome design with true dark mode, mobile tab bar and keyboard shortcuts.
- Security headers and Content Security Policy.
- Database isolation tests, unit tests, Playwright e2e and GitHub Actions CI.
- SECURITY.md and architecture decision records.

### Removed

- MongoDB, custom JWT handling, the password reset route, shared demo
  credentials, demo user switching and admin resets.
- v1 scripts, logs and docs that no longer applied.

### Security

Fixes every issue listed in [SECURITY.md](SECURITY.md#v1--v2).

## 1.0.0

The v1 Next.js 15 + MongoDB app, preserved at tag `v1.0.0`.
