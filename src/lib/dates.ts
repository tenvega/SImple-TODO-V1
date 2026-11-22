/**
 * Time-zone-aware day math without a date library. Server code renders in the
 * visitor's zone (from the `tz` cookie), so "today" means their today.
 */

const partsCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string) {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

function zonedParts(date: Date, timeZone: string) {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(timeZone).formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Milliseconds the zone is ahead of UTC at that instant. */
function zoneOffset(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64 || !/^[A-Za-z_+\-/0-9]+$/.test(value)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Midnight at the start of the zoned day containing `date`, shifted by `addDays`. */
export function startOfDay(date: Date, timeZone: string, addDays = 0): Date {
  const p = zonedParts(date, timeZone);
  return wallToInstant(Date.UTC(p.year, p.month - 1, p.day + addDays), timeZone);
}

/** Converts a wall-clock time (encoded as UTC millis) in the zone to a real instant. */
function wallToInstant(wall: number, timeZone: string): Date {
  // Two passes settle the offset when the time sits next to a DST change.
  let t = wall - zoneOffset(new Date(wall), timeZone);
  t = wall - zoneOffset(new Date(t), timeZone);
  return new Date(t);
}

/** "2026-11-22" for the zoned calendar day of `date`. */
export function dayKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Whole calendar days from `from` to `to` in the zone (negative if earlier). */
export function daysBetween(from: Date, to: Date, timeZone: string): number {
  const a = dayKey(from, timeZone).split("-").map(Number);
  const b = dayKey(to, timeZone).split("-").map(Number);
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86_400_000);
}

export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
}

/** "Saturday, November 21" */
export function formatLongDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" }).format(date);
}

/** Relative day name: Today, Tomorrow, Yesterday, a weekday this week, else "Thu, Nov 19". */
export function formatDay(date: Date, now: Date, timeZone: string, style: "short" | "long" = "short"): string {
  const diff = daysBetween(now, date, timeZone);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) {
    return new Intl.DateTimeFormat("en-US", { timeZone, weekday: style }).format(date);
  }
  const sameYear = dayKey(date, timeZone).slice(0, 4) === dayKey(now, timeZone).slice(0, 4);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** "Tomorrow, 3:00 PM" or "Thu, Nov 19" for an all-day date. */
export function formatDue(due: Date, hasTime: boolean, now: Date, timeZone: string): string {
  const day = formatDay(due, now, timeZone);
  return hasTime ? `${day}, ${formatTime(due, timeZone)}` : day;
}

/** "15:30" wall-clock time of `date` in the zone, for <input type="time">. */
export function timeKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** The instant for a wall-clock date ("2026-11-22") and optional time ("15:30") in the zone. */
export function fromZoned(day: string, time: string | null, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [h, min] = (time ?? "00:00").split(":").map(Number);
  return wallToInstant(Date.UTC(y, m - 1, d, h, min), timeZone);
}
