import "server-only";

import { startOfDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getTimeZone } from "@/lib/tasks/queries";
import type { Priority } from "@/lib/tasks/types";

export type FocusData = {
  tasks: { id: string; title: string; priority: Priority }[];
  todaySeconds: number;
  todaySessions: number;
};

/** Open tasks for the picker and today's focused time. RLS scopes both to the caller. */
export async function getFocusData(): Promise<FocusData> {
  const [supabase, timeZone] = await Promise.all([createClient(), getTimeZone()]);
  const today = startOfDay(new Date(), timeZone).toISOString();

  const [tasks, sessions] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, priority")
      .is("completed_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200),
    supabase.from("focus_sessions").select("duration_seconds").eq("kind", "work").gte("ended_at", today),
  ]);
  if (tasks.error || sessions.error) throw new Error("Could not load focus data.");

  return {
    tasks: tasks.data,
    todaySeconds: sessions.data.reduce((sum, s) => sum + s.duration_seconds, 0),
    todaySessions: sessions.data.length,
  };
}
