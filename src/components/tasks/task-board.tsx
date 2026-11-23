"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { deleteTask, saveTask, setTaskCompleted } from "@/app/actions/tasks";
import { dayKey, formatLongDate, startOfDay } from "@/lib/dates";
import { belongsTo, groupTasks } from "@/lib/tasks/groups";
import type { QuickAdd } from "@/lib/tasks/quick-add";
import type { Task, TaskView } from "@/lib/tasks/types";
import { DetailsSheet } from "./details-sheet";
import { QuickAddBar } from "./quick-add";
import { TaskRow } from "./task-row";

type Op = { type: "upsert"; task: Task } | { type: "remove"; id: string };

function reduce(tasks: Task[], op: Op): Task[] {
  if (op.type === "remove") return tasks.filter((t) => t.id !== op.id);
  const i = tasks.findIndex((t) => t.id === op.task.id);
  return i === -1 ? [...tasks, op.task] : tasks.with(i, op.task);
}

const EMPTY: Record<TaskView, string> = {
  today: "Nothing due today. Enjoy it.",
  upcoming: "Nothing scheduled. Add a task with a date, like “Friday 10am”.",
  all: "No open tasks. Add one above.",
  completed: "Finished tasks show up here.",
};

type Props = {
  view: TaskView;
  tasks: Task[];
  now: string;
  timeZone: string;
  /** A task opened by link that isn't in this list (e.g. an old completion from search). */
  linked?: Task | null;
};

/**
 * One task list with optimistic updates: the UI changes at once, the Server
 * Action runs, and the server's re-render replaces the optimistic state.
 */
export function TaskBoard({ view, tasks, now: nowIso, timeZone, linked = null }: Props) {
  const now = new Date(nowIso);
  const router = useRouter();
  const [optimistic, apply] = useOptimistic(tasks, reduce);
  const [, startTransition] = useTransition();
  /** One short message at a time: an error, or where a new task went. */
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const pathname = usePathname();
  const selectedId = useSearchParams().get("task");
  const selected =
    optimistic.find((t) => t.id === selectedId) ?? (linked && linked.id === selectedId ? linked : null);
  /** True while the open sheet's URL entry is one this page pushed, so closing can go back. */
  const pushedSheet = useRef(false);
  useEffect(() => {
    // Closed some other way (the browser's Back button): nothing left to undo.
    if (!selectedId) pushedSheet.current = false;
  }, [selectedId]);

  // A new task gets a temporary ID; keep its row key once the real ID arrives
  // so the row doesn't re-animate in.
  const [rowKeys, setRowKeys] = useState<Record<string, string>>({});
  const keyFor = (id: string) => rowKeys[id] ?? id;

  // The list was rendered for one calendar day. When the day changes (tab left
  // open overnight, or returning to it), fetch it again so "today", overdue
  // and quick add's default date are right.
  useEffect(() => {
    const renderedDay = dayKey(new Date(nowIso), timeZone);
    const check = () => {
      if (dayKey(new Date(), timeZone) !== renderedDay) router.refresh();
    };
    const untilMidnight = startOfDay(new Date(nowIso), timeZone, 1).getTime() - Date.now();
    const timer = setTimeout(check, Math.max(untilMidnight, 0) + 1_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [nowIso, timeZone, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function mutate(
    op: Op,
    action: () => Promise<{ ok: boolean; error?: string; id?: string }>,
    tempId?: string,
    savedMessage?: string,
  ) {
    startTransition(async () => {
      apply(op);
      let result: { ok: boolean; error?: string; id?: string };
      try {
        result = await action();
      } catch {
        // Offline or the server didn't answer. The optimistic change rolls
        // back when this transition ends; say so instead of crashing the page.
        result = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
      }
      if (!result.ok) setToast({ text: result.error ?? "Something went wrong.", error: true });
      else if (savedMessage) setToast({ text: savedMessage, error: false });
      if (result.ok && tempId && result.id) {
        const realId = result.id;
        startTransition(() => setRowKeys((k) => ({ ...k, [realId]: tempId })));
      }
    });
  }

  function add(q: QuickAdd) {
    const tempId = `new-${crypto.randomUUID()}`;
    const task: Task = {
      id: tempId,
      title: q.title,
      notes: null,
      dueAt: q.dueAt?.toISOString() ?? null,
      dueHasTime: q.dueHasTime,
      priority: q.priority,
      completedAt: null,
      tags: q.tags,
      focusCount: 0,
      focusSeconds: 0,
    };
    mutate(
      { type: "upsert", task },
      () => saveTask({ title: task.title, dueAt: task.dueAt, dueHasTime: task.dueHasTime, priority: task.priority, tags: task.tags }),
      tempId,
      // A task for another list would vanish from view; say where it went.
      belongsTo(view, task, now, timeZone) ? undefined : `Added to ${destination(task)}`,
    );
  }

  function destination(task: Task) {
    if (task.dueAt && belongsTo("today", task, now, timeZone)) return "Today";
    return task.dueAt ? "Upcoming" : "All";
  }

  function toggle(task: Task) {
    const completed = !task.completedAt;
    mutate({ type: "upsert", task: { ...task, completedAt: completed ? new Date().toISOString() : null } }, () =>
      setTaskCompleted(task.id, completed),
    );
  }

  function open(task: Task) {
    if (task.id.startsWith("new-")) return; // still saving
    pushedSheet.current = true;
    window.history.pushState(null, "", `${pathname}?task=${task.id}`);
  }

  /** Leaves the sheet's URL without adding history, so Back doesn't reopen it. */
  function leaveSheetUrl() {
    if (pushedSheet.current) {
      pushedSheet.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", pathname);
    }
  }

  function closeSheet(edited: Task | null) {
    leaveSheetUrl();
    if (edited) {
      mutate({ type: "upsert", task: edited }, () =>
        saveTask({
          id: edited.id,
          title: edited.title,
          notes: edited.notes,
          dueAt: edited.dueAt,
          dueHasTime: edited.dueHasTime,
          priority: edited.priority,
          tags: edited.tags,
        }),
      );
    }
  }

  function remove(task: Task) {
    leaveSheetUrl();
    mutate({ type: "remove", id: task.id }, () => deleteTask(task.id));
  }

  const sections = groupTasks(view, optimistic, now, timeZone);
  const open_ = optimistic.filter((t) => !t.completedAt && sections.some((s) => s.tasks.includes(t)));
  const overdueCount = sections.find((s) => s.key === "overdue")?.tasks.length ?? 0;
  const summary =
    view === "completed"
      ? `${optimistic.length} completed`
      : [
          view === "today" ? formatLongDate(now, timeZone) : null,
          `${open_.length} task${open_.length === 1 ? "" : "s"}`,
          overdueCount ? `${overdueCount} overdue` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const defaultDue =
    view === "today" ? startOfDay(now, timeZone) : view === "upcoming" ? startOfDay(now, timeZone, 1) : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-7">
        <p className="-mt-5 text-sm text-muted">{summary}</p>
        {view !== "completed" ? <QuickAddBar defaultDue={defaultDue} timeZone={timeZone} onAdd={add} /> : null}

        <LayoutGroup>
          {sections.length === 0 ? <p className="py-10 text-center text-muted">{EMPTY[view]}</p> : null}
          {sections.map((section) => (
            <motion.section
              key={section.key}
              layout="position"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              aria-label={section.title ?? undefined}
              className="flex flex-col"
            >
              {section.title ? (
                <h2 className="mb-1 text-[13px] font-semibold text-muted">{section.title}</h2>
              ) : null}
              <ul>
                <AnimatePresence initial={false}>
                  {section.tasks.map((task) => (
                    <TaskRow
                      key={keyFor(task.id)}
                      layoutKey={keyFor(task.id)}
                      task={task}
                      view={view}
                      now={now}
                      timeZone={timeZone}
                      selected={task.id === selectedId}
                      onToggle={() => toggle(task)}
                      onOpen={() => open(task)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </LayoutGroup>
      </div>

      <AnimatePresence>
        {selected ? (
          <DetailsSheet
            key={selected.id}
            task={selected}
            timeZone={timeZone}
            onClose={closeSheet}
            onDelete={() => remove(selected)}
          />
        ) : null}
      </AnimatePresence>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center md:bottom-8">
        {toast ? (
          <p
            role={toast.error ? "alert" : "status"}
            className="pointer-events-auto rounded-xl bg-inv px-4 py-2.5 text-sm text-inv-fg shadow-sheet"
          >
            {toast.text}
          </p>
        ) : null}
      </div>
    </MotionConfig>
  );
}
