# 0003: Static Content Security Policy instead of nonces

**Status:** accepted · 2026-11-22

## Context

A nonce-based CSP is the strongest option, but a nonce must be unique per
response. That forces every page to render dynamically, which conflicts with
Cache Components / Partial Prerendering: the static shell is generated once
and can't carry a per-request nonce.

## Decision

Send a static CSP from `next.config.ts`:

`default-src 'self'`; `script-src 'self' 'unsafe-inline'` (no `'unsafe-eval'`
in production); `connect-src` limited to this origin and the Supabase project;
`object-src 'none'`; `base-uri`, `form-action` `'self'`; `frame-ancestors 'none'`;
`upgrade-insecure-requests` in production.

## Consequences

- Pages keep a prerendered shell and stream user data in, so they're fast.
- Inline scripts are allowed, so the CSP is a second line of defense against
  XSS, not the first. The first is React's escaping, plus never using
  `dangerouslySetInnerHTML` and having no third-party scripts.
- If the app ever needs third-party scripts or user-generated HTML, revisit:
  either nonces on dynamic routes only, or hashes via Next.js's SRI support.
