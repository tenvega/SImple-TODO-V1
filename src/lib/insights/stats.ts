import { dayKey, formatDay, startOfDay } from "@/lib/dates";

/**
 * Turns raw rows into what the Insights page shows. Pure and zone-aware, so
 * a day means the visitor's calendar day and the numbers are unit tested.
 */

export type Range = "week" | "month";
export const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30 };

export type InsightsInput = {
  /** completed_at of tasks finished in the last year. */
  completions: string[];
  /** Work sessions in the last year. */
  sessions: { endedAt: string; seconds: number }[];
  /** Tasks due in the current period up to now. */
  due: { completedAt: string | null }[];
  now: Date;
  timeZone: string;
  range: Range;
};

export type DayStat = {
  key: string;
  /** Start of the day, ISO. */
  date: string;
  tasks: number;
  focusSeconds: number;
  isToday: boolean;
};

export type Insights = {
  range: Range;
  days: DayStat[];
  tasksDone: number;
  tasksBefore: number;
  focusSeconds: number;
  focusSessions: number;
  streak: number;
  bestStreak: number;
  dueCount: number;
  dueDone: number;
  bestDay: DayStat | null;
  summary: string;
};

/** "6h 40m", "45m". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function streaks(active: Set<string>, now: Date, timeZone: string) {
  // Today still counts as "in progress": an empty today doesn't break the streak.
  let current = 0;
  let offset = active.has(dayKey(now, timeZone)) ? 0 : -1;
  while (active.has(dayKey(startOfDay(now, timeZone, offset), timeZone))) {
    current += 1;
    offset -= 1;
  }

  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const key of [...active].sort()) {
    const [y, m, d] = key.split("-").map(Number);
    const day = Date.UTC(y, m - 1, d) / 86_400_000;
    run = previous !== null && day - previous === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return { current, best: Math.max(best, current) };
}

export function computeInsights({ completions, sessions, due, now, timeZone, range }: InsightsInput): Insights {
  const n = RANGE_DAYS[range];
  const todayKey = dayKey(now, timeZone);
  const start = startOfDay(now, timeZone, -(n - 1)).getTime();
  const previousStart = startOfDay(now, timeZone, -(2 * n - 1)).getTime();

  const days: DayStat[] = Array.from({ length: n }, (_, i) => {
    const date = startOfDay(now, timeZone, i - (n - 1));
    const key = dayKey(date, timeZone);
    return { key, date: date.toISOString(), tasks: 0, focusSeconds: 0, isToday: key === todayKey };
  });
  const byKey = new Map(days.map((d) => [d.key, d]));
  const active = new Set<string>();

  let tasksBefore = 0;
  for (const iso of completions) {
    const t = Date.parse(iso);
    const key = dayKey(new Date(t), timeZone);
    active.add(key);
    const day = byKey.get(key);
    if (day && t >= start) day.tasks += 1;
    else if (t >= previousStart && t < start) tasksBefore += 1;
  }

  let focusSessions = 0;
  for (const s of sessions) {
    const t = Date.parse(s.endedAt);
    const key = dayKey(new Date(t), timeZone);
    active.add(key);
    const day = byKey.get(key);
    if (day && t >= start) {
      day.focusSeconds += s.seconds;
      focusSessions += 1;
    }
  }

  const tasksDone = days.reduce((sum, d) => sum + d.tasks, 0);
  const focusSeconds = days.reduce((sum, d) => sum + d.focusSeconds, 0);
  const bestDay = days.reduce<DayStat | null>(
    (best, d) =>
      d.tasks > 0 && (!best || d.tasks > best.tasks || (d.tasks === best.tasks && d.focusSeconds > best.focusSeconds))
        ? d
        : best,
    null,
  );
  const { current, best } = streaks(active, now, timeZone);

  const result = {
    range,
    days,
    tasksDone,
    tasksBefore,
    focusSeconds,
    focusSessions,
    streak: current,
    bestStreak: best,
    dueCount: due.length,
    dueDone: due.filter((t) => t.completedAt !== null).length,
    bestDay,
  };
  return { ...result, summary: summarize(result, now, timeZone) };
}

function summarize(s: Omit<Insights, "summary">, now: Date, timeZone: string): string {
  const period = s.range === "week" ? "this week" : "in the last 30 days";
  const before = s.range === "week" ? "last week" : "the 30 days before";

  if (s.tasksDone === 0 && s.focusSeconds === 0) {
    return `Nothing logged ${period} yet. Finish a task or start a focus session and your trends will show up here.`;
  }

  const parts: string[] = [];
  if (s.tasksDone > 0) {
    const diff = s.tasksDone - s.tasksBefore;
    const comparison =
      s.tasksBefore === 0
        ? ""
        : diff === 0
          ? `, the same as ${before}`
          : `, ${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than ${before}`;
    parts.push(`You finished ${plural(s.tasksDone, "task")} ${period}${comparison}.`);
  } else {
    parts.push(`You focused for ${formatDuration(s.focusSeconds)} ${period} across ${plural(s.focusSessions, "session")}.`);
  }

  if (s.bestDay && s.tasksDone > 1) {
    const date = new Date(s.bestDay.date);
    const name = s.bestDay.isToday
      ? "Today"
      : s.range === "week"
        ? new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date)
        : formatDay(date, now, timeZone);
    parts.push(`${name} was your most productive day.`);
  }
  return parts.join(" ");
}
