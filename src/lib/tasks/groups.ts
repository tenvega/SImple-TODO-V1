import { daysBetween, dayKey, formatDay, startOfDay } from "@/lib/dates";
import type { Priority, Task, TaskView } from "./types";

export type TaskSection = { key: string; title: string | null; tasks: Task[] };

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

const time = (iso: string | null) => (iso ? Date.parse(iso) : Number.POSITIVE_INFINITY);

function byDueThenPriority(a: Task, b: Task) {
  return (
    time(a.dueAt) - time(b.dueAt) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    a.title.localeCompare(b.title)
  );
}

function byCompletedDesc(a: Task, b: Task) {
  return time(b.completedAt) - time(a.completedAt);
}

/** Which view a task belongs to right now. Used to drop optimistic rows that moved out. */
export function belongsTo(view: TaskView, task: Task, now: Date, timeZone: string): boolean {
  // Database timestamps and JS ISO strings are formatted differently, so
  // compare instants, never strings.
  const tomorrow = startOfDay(now, timeZone, 1).getTime();
  const today = startOfDay(now, timeZone).getTime();
  const due = task.dueAt ? Date.parse(task.dueAt) : null;
  const done = task.completedAt ? Date.parse(task.completedAt) : null;
  switch (view) {
    case "today":
      return due !== null && due < tomorrow && (done === null || done >= today);
    case "upcoming":
      return !task.completedAt && due !== null && due >= tomorrow;
    case "all":
      return !task.completedAt;
    case "completed":
      return task.completedAt !== null;
  }
}

/** Splits a view's tasks into the sections shown on screen. Pure, so it renders the same on server and client. */
export function groupTasks(view: TaskView, tasks: Task[], now: Date, timeZone: string): TaskSection[] {
  const visible = tasks.filter((t) => belongsTo(view, t, now, timeZone));

  if (view === "today") {
    const todayStart = startOfDay(now, timeZone).getTime();
    const overdue = visible.filter((t) => !t.completedAt && new Date(t.dueAt!).getTime() < todayStart);
    const open = visible.filter((t) => !t.completedAt && new Date(t.dueAt!).getTime() >= todayStart);
    const done = visible.filter((t) => t.completedAt).sort((a, b) => time(a.completedAt) - time(b.completedAt));
    return [
      { key: "overdue", title: "Overdue", tasks: overdue.sort(byDueThenPriority) },
      { key: "today", title: overdue.length ? "Today" : null, tasks: [...open.sort(byDueThenPriority), ...done] },
    ].filter((s) => s.tasks.length > 0);
  }

  if (view === "all") {
    const dated = visible.filter((t) => t.dueAt).sort(byDueThenPriority);
    const undated = visible.filter((t) => !t.dueAt).sort(byDueThenPriority);
    return [
      { key: "dated", title: undated.length ? "Scheduled" : null, tasks: dated },
      { key: "undated", title: "No date", tasks: undated },
    ].filter((s) => s.tasks.length > 0);
  }

  const dateOf = (t: Task) => new Date(view === "completed" ? t.completedAt! : t.dueAt!);
  const sorted = [...visible].sort(view === "completed" ? byCompletedDesc : byDueThenPriority);
  const sections = new Map<string, TaskSection>();
  for (const task of sorted) {
    const date = dateOf(task);
    // Upcoming lists the next week day by day, then one bucket per month.
    const far = view === "upcoming" && daysBetween(now, date, timeZone) >= 7;
    const key = far ? dayKey(date, timeZone).slice(0, 7) : dayKey(date, timeZone);
    let section = sections.get(key);
    if (!section) {
      const title = far
        ? new Intl.DateTimeFormat("en-US", { timeZone, month: "long", year: "numeric" }).format(date)
        : formatDay(date, now, timeZone, "long");
      section = { key, title, tasks: [] };
      sections.set(key, section);
    }
    section.tasks.push(task);
  }
  return [...sections.values()];
}
