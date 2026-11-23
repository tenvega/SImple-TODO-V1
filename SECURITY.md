# Security

## Reporting a vulnerability

Please open a [private security advisory](../../security/advisories/new) on
this repository rather than a public issue. I'll reply within a week.

## The model

TaskFlow is a multi-user app where each person's tasks and focus history are
private. The one property that matters most:

> **A user can never read or change another user's data, whatever they send.**

It's enforced in the database, not only in the app:

1. **Row Level Security on every table.** Policies allow a row only when
   `user_id = auth.uid()`, the ID inside the caller's signed JWT. Signed-out
   visitors (`anon`) have every privilege revoked.
2. **Ownership is never client input.** `user_id` defaults to `auth.uid()`;
   inserting or moving a row to another user fails the policy check.
3. **Composite foreign keys.** Tags, task links and focus sessions reference
   `(id, user_id)`, so even a valid ID from another account can't be linked.
4. **No privileged keys in the app.** The server uses the same publishable key
   as the browser and acts with the user's JWT. Startup fails if a secret key
   is configured by mistake.
5. **Security-definer code is minimal.** Only the profile trigger, the quota
   trigger, the sign-up guard, the email blocks and the sandbox cleanup job
   run with elevated rights; all have `search_path = ''` and no API grants.
   Everything except the profile and quota triggers lives in a `private`
   schema the API can't reach.

`tests/db` checks these rules by signing in as two real users and attacking
directly through the API: reading, updating, deleting, inserting as the other
user, moving rows across accounts, linking to the other user's tags and
sessions, reusing their IDs, and calling privileged functions.
`tests/e2e/isolation.spec.ts` repeats the check through the UI with two
browsers. Turning RLS off on `tasks` makes the isolation tests fail, so they check the policy rather than passing anyway.

## v1 → v2

v1 (tag `v1.0.0`) was a portfolio demo. An audit before the rebuild found:

| v1 issue | v2 fix |
| --- | --- |
| A JWT was issued but never verified; API routes trusted a `userId` from the URL or body | The user comes only from the verified session (`getClaims()`); RLS checks every query again |
| Anyone could read, edit or delete any user's tasks and accounts | Owner-only RLS on every table, proven by tests |
| An unauthenticated reset-password route returned the new password | No passwords at all: every account is a private anonymous sandbox |
| Demo user ID hard-coded in a script; demo password committed in `LoginForm.tsx` | Every demo visitor gets their own anonymous sandbox; there are no shared credentials |
| `POST /api/tasks` accepted any fields (mass assignment) | zod schemas list exactly what a client may send; `user_id` is never accepted |
| Hard-coded fallbacks for `JWT_SECRET` and `DEMO_ACCESS_CODE` | Env vars validated at startup; no fallbacks; secret keys rejected |
| Token stored in `localStorage` | Session in cookies managed by `@supabase/ssr` and refreshed by the proxy |
| No rate limiting | Supabase Auth per-IP limits on sign-in, sign-up and anonymous users; per-account row quotas in Postgres |
| Search built a regex from raw input | Escaped `ILIKE` patterns, matched literally |
| `Math.random()` passwords | No generated passwords |
| `next.config` ignored TypeScript and lint errors | Strict TS, lint with zero warnings, knip and audit all gate CI |
| No security headers | CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer and Permissions policies, COOP |

**Note on history:** v1's demo-account password and demo user ID remain in
this repository's git history. They're a login for the v1 app's demo user,
not database credentials: the MongoDB connection string was never committed
(history only has the placeholder in v1's `.env.example`). v1's database
was deleted on 2026-11-22, so they no longer grant access to anything.

## Other protections

- **Server Actions** check the session and validate input on every call, and
  return generic messages, never database errors. Next.js adds Origin checks,
  encrypted action IDs and a 1 MB body limit.
- **Open redirects:** `/auth/confirm` only follows same-site relative paths.
- **Account enumeration:** the sign-in form gives the same answer whether or
  not an address has an account.
- **No email, by design:** TaskFlow is demo-only. The email provider is off,
  a Send Email hook (`private.reject_auth_email`) refuses every message Auth
  would send, and a trigger on `auth.users` blocks setting an email on any
  account. Without the hook, Auth would still email an arbitrary address when
  a sandbox called `updateUser({ email })`, even with the provider off;
  `tests/db/demo-only.test.ts` checks that no mail reaches the test inbox.
- **Abuse limits, sized for the free plan's 500 MB database:**
  - per sandbox: 300 tasks, 50 tags, 1,500 focus sessions and 2,000-character
    notes (worst case about 1 MB; a seeded sandbox is about 50 KB);
  - per IP: 30 new sandboxes an hour (Supabase Auth);
  - across everyone: a trigger on `auth.users` refuses new sandboxes once 120
    were created in the past hour or the database passes 400 MB, and the
    demo button says it's busy. Existing sandboxes keep working;
  - sandboxes are deleted by `pg_cron` after 7 days.

  `tests/db/limits.test.ts` checks the per-sandbox limits.
- **Injection:** no SQL is ever built from input. Queries go through
  PostgREST's parameterized API or typed RPC arguments, search escapes `ILIKE`
  wildcards, the seed validates time zones against `pg_timezone_names`, and
  every Server Action validates input with zod. React escapes all rendered
  text, and there's no `dangerouslySetInnerHTML`.
- **Idempotent writes:** focus sessions carry a client-generated UUID, so a
  retry can't create duplicates.
- **Supply chain:** `npm audit` gates CI, Dependabot updates npm packages and
  Actions weekly, and the CI token is read-only.

## Known trade-offs

- **Static CSP with `'unsafe-inline'` scripts.** Nonces would make every page
  dynamic and lose the prerendered shell. The policy still blocks every other
  origin, `eval` in production, plugins, framing and base-tag injection, and
  React escapes all rendered text. See [ADR 0003](docs/adr/0003-content-security-policy.md).
- **Session cookies are readable by JavaScript.** `@supabase/ssr` needs this
  so the browser client can make authenticated calls. Tokens are short-lived
  and RLS still limits what a stolen token can reach: one user's own data.
- **No per-request rate limit on Server Actions.** Row quotas cap what a
  sandbox can store, but not how often it can call. On the free plans a flood
  hits Vercel's and Supabase's usage limits (which pause rather than bill).
  A shared limiter (Redis or similar) is the next step before real traffic.
- **CAPTCHA isn't enabled.** Supabase Auth supports Cloudflare Turnstile and
  hCaptcha. Turning one on for anonymous sign-ins is recommended for a public
  deployment (see the deployment checklist below).

## Deployment checklist (hosted Supabase + Vercel)

- [ ] Apply migrations with `supabase db push`; confirm `pg_cron` is enabled.
- [ ] Auth: enable anonymous sign-ins; turn the **Email** provider off.
- [ ] Auth Hooks: enable **Send Email** → Postgres → `private.reject_auth_email`.
- [ ] Auth URL Configuration: Site URL `https://<domain>` (no redirect URLs needed).
- [ ] Auth: enable CAPTCHA (Turnstile) and add its site key to the client.
- [ ] API settings: set Max Rows to 5000 to match `supabase/config.toml`.
- [ ] Vercel env: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
      No secret keys.
- [ ] Run Supabase's Security Advisor and resolve any findings.
