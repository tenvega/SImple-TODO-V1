import "server-only";

import { cookies } from "next/headers";
import { isValidTimeZone, startOfDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskView } from "./types";

export const TIME_ZONE_COOKIE = "tz";

/** The visitor's IANA time zone, remembered in a cookie by the browser. */
export async function getTimeZone(): Promise<string> {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  return isValidTimeZone(value) ? value : "UTC";
}

// Columns the UI needs. user_id is deliberately absent: the client never
// needs to know or send it.
const TASK_COLUMNS =
  "id, title, notes, due_at, due_has_time, priority, completed_at, task_tags(tags(name)), focus_sessions(duration_seconds)";

type Row = {
  id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  due_has_time: boolean;
  priority: Task["priority"];
  completed_at: string | null;
  task_tags: { tags: { name: string } | null }[];
  focus_sessions: { duration_seconds: number }[];
};

function toTask(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueAt: row.due_at,
    dueHasTime: row.due_has_time,
    priority: row.priority,
    completedAt: row.completed_at,
    tags: row.task_tags.flatMap((t) => (t.tags ? [t.tags.name] : [])).sort(),
    focusCount: row.focus_sessions.length,
    focusSeconds: row.focus_sessions.reduce((sum, s) => sum + s.duration_seconds, 0),
  };
}

export type ViewData = { tasks: Task[]; now: string; timeZone: string };

/**
 * Loads one list. Row Level Security limits every query to the caller's own
 * rows, so there is no user filter here to forget.
 */
export async function getTaskView(view: TaskView): Promise<ViewData> {
  const [supabase, timeZone] = await Promise.all([createClient(), getTimeZone()]);
  const now = new Date();
  const today = startOfDay(now, timeZone).toISOString();
  const tomorrow = startOfDay(now, timeZone, 1).toISOString();

  let query = supabase.from("tasks").select(TASK_COLUMNS);
  switch (view) {
    case "today":
      query = query.lt("due_at", tomorrow).or(`completed_at.is.null,completed_at.gte.${today}`);
      break;
    case "upcoming":
      query = query.is("completed_at", null).gte("due_at", tomorrow);
      break;
    case "all":
      query = query.is("completed_at", null);
      break;
    case "completed":
      query = query.not("completed_at", "is", null).order("completed_at", { ascending: false });
      break;
  }

  const { data, error } = await query
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(view === "completed" ? 200 : 1000)
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error("Could not load tasks.");

  return { tasks: data.map(toTask), now: now.toISOString(), timeZone };
}

export type ViewCounts = { today: number; upcoming: number; all: number };

/** Open-task counts for the sidebar. */
export async function getViewCounts(): Promise<ViewCounts> {
  const [supabase, timeZone] = await Promise.all([createClient(), getTimeZone()]);
  const tomorrow = startOfDay(new Date(), timeZone, 1).toISOString();
  const open = () => supabase.from("tasks").select("id", { count: "exact", head: true }).is("completed_at", null);

  const [today, upcoming, all] = await Promise.all([
    open().lt("due_at", tomorrow),
    open().gte("due_at", tomorrow),
    open(),
  ]);
  return { today: today.count ?? 0, upcoming: upcoming.count ?? 0, all: all.count ?? 0 };
}
