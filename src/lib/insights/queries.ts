import "server-only";

import { startOfDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getTimeZone } from "@/lib/tasks/queries";
import { computeInsights, RANGE_DAYS, type Insights, type Range } from "./stats";

/**
 * Loads a year of completion and focus timestamps (enough for streaks) and
 * computes the page in TypeScript. Row Level Security limits every query to
 * the caller; per-account row quotas keep the payload small.
 */
export async function getInsights(range: Range): Promise<{ insights: Insights; timeZone: string; now: string }> {
  const [supabase, timeZone] = await Promise.all([createClient(), getTimeZone()]);
  const now = new Date();
  const yearAgo = startOfDay(now, timeZone, -365).toISOString();
  const periodStart = startOfDay(now, timeZone, -(RANGE_DAYS[range] - 1)).toISOString();

  const [completions, sessions, due] = await Promise.all([
    supabase.from("tasks").select("completed_at").gte("completed_at", yearAgo).limit(5000),
    supabase
      .from("focus_sessions")
      .select("ended_at, duration_seconds")
      .eq("kind", "work")
      .gte("ended_at", yearAgo)
      .limit(5000),
    // Tasks whose due time has passed. All-day tasks are stored at local
    // midnight, so today's only count once the day is over.
    supabase
      .from("tasks")
      .select("completed_at")
      .gte("due_at", periodStart)
      .lte("due_at", now.toISOString())
      .or(`due_has_time.eq.true,due_at.lt.${startOfDay(now, timeZone).toISOString()}`)
      .limit(5000),
  ]);
  if (completions.error || sessions.error || due.error) throw new Error("Could not load insights.");

  const insights = computeInsights({
    completions: completions.data.flatMap((t) => (t.completed_at ? [t.completed_at] : [])),
    sessions: sessions.data.map((s) => ({ endedAt: s.ended_at, seconds: s.duration_seconds })),
    due: due.data.map((t) => ({ completedAt: t.completed_at })),
    now,
    timeZone,
    range,
  });
  return { insights, timeZone, now: now.toISOString() };
}
