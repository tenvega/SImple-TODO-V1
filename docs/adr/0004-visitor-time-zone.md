# 0004: Render dates in the visitor's time zone on the server

**Status:** accepted · 2026-11-22

## Context

"Today", "overdue", streaks and daily charts depend on the visitor's calendar
day. Servers run in UTC, so a task due at 11 PM in New York would land on the
wrong day, and server and client renders would disagree.

## Decision

The browser reports its IANA time zone once; a Server Action validates it and
stores it in an `httpOnly` cookie. Server Components read the cookie and pass
`now` and the zone to pure functions in `src/lib/dates.ts` (zoned day math
with no date library), which group tasks and compute stats. All-day tasks
store the start of that day in the user's zone, with `due_has_time = false`.

## Consequences

- Server and client agree on every date, so nothing shifts during hydration.
- Day math is unit tested across zones and DST changes.
- The first request after the zone changes renders once in the old zone;
  setting the cookie triggers an immediate re-render.
