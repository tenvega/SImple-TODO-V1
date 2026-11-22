"use client";

import { motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import { daysBetween, formatDay, formatDue, formatTime } from "@/lib/dates";
import type { Task, TaskView } from "@/lib/tasks/types";
import { PriorityDot } from "./priority-dot";

type Props = {
  task: Task;
  layoutKey: string;
  view: TaskView;
  now: Date;
  timeZone: string;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

function dueText(task: Task, view: TaskView, now: Date, timeZone: string) {
  if (task.completedAt) return `Done ${formatTime(new Date(task.completedAt), timeZone)}`;
  if (!task.dueAt) return null;
  const due = new Date(task.dueAt);
  const overdue = daysBetween(now, due, timeZone) < 0;
  // Today and Upcoming already name the day in a heading.
  if (!overdue && (view === "today" || view === "upcoming")) {
    return task.dueHasTime ? formatTime(due, timeZone) : null;
  }
  return overdue ? formatDay(due, now, timeZone) : formatDue(due, task.dueHasTime, now, timeZone);
}

export function TaskRow({ task, layoutKey, view, now, timeZone, selected, onToggle, onOpen }: Props) {
  const done = task.completedAt !== null;
  const due = dueText(task, view, now, timeZone);
  const overdue = !done && task.dueAt !== null && daysBetween(now, new Date(task.dueAt), timeZone) < 0;
  const meta = [
    due ? { key: "due", text: due, strong: overdue } : null,
    ...task.tags.map((t) => ({ key: t, text: `#${t}`, strong: false })),
    task.focusCount > 0
      ? { key: "focus", text: `${task.focusCount} focus session${task.focusCount === 1 ? "" : "s"}`, strong: false }
      : null,
  ].filter((m) => m !== null);

  return (
    <motion.li
      layout="position"
      layoutId={layoutKey}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className={`group flex min-h-[60px] items-center gap-1 border-b border-line pr-3 last:border-b-0 ${
        selected ? "rounded-[10px] bg-sel" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${done ? "Mark incomplete" : "Complete"}: ${task.title}`}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        {done ? (
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            className="flex size-5 items-center justify-center rounded-full bg-fg text-bg"
          >
            <CheckIcon size={12} />
          </motion.span>
        ) : (
          <span className="size-5 rounded-full border-[1.5px] border-muted transition-colors group-hover:border-fg" />
        )}
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 text-left"
      >
        <span className={`truncate ${done ? "text-muted line-through" : ""} ${selected ? "font-medium" : ""}`}>
          {task.title}
        </span>
        {meta.length > 0 ? (
          <span className="truncate text-[13px] text-muted">
            {meta.map((m, i) => (
              <span key={m.key}>
                {i > 0 ? " · " : ""}
                <span className={m.strong ? "font-medium text-fg" : ""}>{m.text}</span>
              </span>
            ))}
          </span>
        ) : null}
      </button>
      {!done ? <PriorityDot priority={task.priority} /> : null}
    </motion.li>
  );
}
