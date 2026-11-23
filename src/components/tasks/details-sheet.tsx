"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { CloseIcon, PlayIcon } from "@/components/icons";
import { dayKey, fromZoned, timeKey } from "@/lib/dates";
import { MAX_TAGS, PRIORITIES, TAG_PATTERN, type Task } from "@/lib/tasks/types";
import { PRIORITY_LABEL } from "./priority-dot";
import { useMediaQuery } from "./use-media-query";

type Props = {
  task: Task;
  timeZone: string;
  onClose: (edited: Task | null) => void;
  onDelete: () => void;
};

const spring = { type: "spring", stiffness: 420, damping: 40 } as const;

function sameTask(a: Task, b: Task) {
  return (
    a.title === b.title &&
    (a.notes ?? "") === (b.notes ?? "") &&
    a.dueAt === b.dueAt &&
    a.dueHasTime === b.dueHasTime &&
    a.priority === b.priority &&
    a.tags.join() === b.tags.join()
  );
}

/**
 * Slide-over on desktop, bottom sheet on phones. Edits are kept locally and
 * saved once when the sheet closes, like Reminders.
 */
export function DetailsSheet({ task, timeZone, onClose, onDelete }: Props) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const headingId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(task);
  const [tagText, setTagText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const due = draft.dueAt ? new Date(draft.dueAt) : null;
  const day = due ? dayKey(due, timeZone) : "";
  const time = due && draft.dueHasTime ? timeKey(due, timeZone) : "";

  function close() {
    const cleaned = { ...draft, title: draft.title.trim() || task.title, notes: draft.notes?.trim() || null };
    onClose(sameTask(cleaned, task) ? null : cleaned);
  }

  // Escape closes (and saves), wherever focus is inside the sheet.
  const onEscape = useEffectEvent(close);
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    titleRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      returnTo?.focus?.({ preventScroll: true });
    };
  }, []);

  function setDue(nextDay: string, nextTime: string) {
    if (!nextDay) {
      setDraft((d) => ({ ...d, dueAt: null, dueHasTime: false }));
      return;
    }
    const instant = fromZoned(nextDay, nextTime || null, timeZone);
    setDraft((d) => ({ ...d, dueAt: instant.toISOString(), dueHasTime: Boolean(nextTime) }));
  }

  function addTag() {
    const tag = tagText.trim().replace(/^#/, "").toLowerCase();
    if (TAG_PATTERN.test(tag) && !draft.tags.includes(tag) && draft.tags.length < MAX_TAGS) {
      setDraft((d) => ({ ...d, tags: [...d.tags, tag].sort() }));
    }
    setTagText("");
  }

  const minutes = Math.round(task.focusSeconds / 60);

  return (
    <>
      {!desktop ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-40 bg-black/30"
          aria-hidden="true"
        />
      ) : null}
      <motion.aside
        role="dialog"
        aria-modal={!desktop}
        aria-labelledby={headingId}
        initial={desktop ? { x: "100%" } : { y: "100%" }}
        animate={desktop ? { x: 0 } : { y: 0 }}
        exit={desktop ? { x: "100%" } : { y: "100%" }}
        transition={spring}
        className="fixed z-50 flex flex-col gap-5 overflow-y-auto bg-bg px-6 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-sheet max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[88dvh] max-md:rounded-t-2xl md:top-0 md:right-0 md:h-dvh md:w-[380px] md:border-l md:border-line"
      >
        <div className="flex items-center justify-between">
          <span id={headingId} className="text-[13px] font-medium text-muted">
            Details
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close details"
            className="flex size-9 items-center justify-center rounded-lg bg-chip"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <label className="sr-only" htmlFor="task-title">
          Title
        </label>
        <input
          ref={titleRef}
          id="task-title"
          value={draft.title}
          maxLength={200}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && close()}
          className="bg-transparent text-[22px] leading-tight font-semibold tracking-tight outline-none focus-visible:outline-none"
        />
        <label className="sr-only" htmlFor="task-notes">
          Notes
        </label>
        <textarea
          id="task-notes"
          value={draft.notes ?? ""}
          maxLength={2000}
          rows={3}
          placeholder="Notes"
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          className="field-sizing-content min-h-16 resize-none bg-transparent text-sm leading-normal text-muted outline-none placeholder:text-muted/60 focus:text-fg"
        />

        <dl className="flex flex-col border-t border-line text-sm">
          <Row label="Due">
            <span className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Due date"
                value={day}
                onChange={(e) => setDue(e.target.value, time)}
                className="rounded-md bg-chip px-2 py-1 font-medium"
              />
              {day ? (
                <input
                  type="time"
                  aria-label="Due time"
                  value={time}
                  onChange={(e) => setDue(day, e.target.value)}
                  className="rounded-md bg-chip px-2 py-1 font-medium"
                />
              ) : null}
            </span>
          </Row>
          <Row label="Priority">
            <span role="radiogroup" aria-label="Priority" className="flex rounded-[9px] bg-chip p-0.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={draft.priority === p}
                  onClick={() => setDraft((d) => ({ ...d, priority: p }))}
                  className={`h-7 rounded-[7px] px-2.5 text-[13px] transition-colors ${
                    draft.priority === p ? "bg-seg font-semibold text-fg shadow-sm" : "text-muted"
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </span>
          </Row>
          <Row label="Tags">
            <span className="flex flex-wrap justify-end gap-1.5 py-2">
              {draft.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() => setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))}
                  className="flex h-[26px] items-center rounded-full bg-chip px-2.5 text-[13px] hover:line-through"
                >
                  #{t}
                </button>
              ))}
              {draft.tags.length < MAX_TAGS ? (
                <input
                  aria-label="Add tag"
                  value={tagText}
                  placeholder="Add"
                  maxLength={33}
                  onChange={(e) => setTagText(e.target.value)}
                  onBlur={addTag}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      addTag();
                    }
                  }}
                  className="h-[26px] w-16 rounded-full border border-dashed border-line bg-transparent px-2.5 text-[13px] outline-none placeholder:text-muted focus:w-24 focus:border-fg"
                />
              ) : null}
            </span>
          </Row>
          <Row label="Focus">
            {task.focusCount > 0
              ? `${task.focusCount} session${task.focusCount === 1 ? "" : "s"} · ${minutes} min`
              : "None yet"}
          </Row>
        </dl>

        <div className="flex-1" />
        {!task.completedAt ? (
          <Link
            href={`/focus?task=${task.id}`}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-inv font-semibold text-inv-fg"
          >
            <PlayIcon />
            Start focus
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`h-11 rounded-xl border transition-colors ${
            confirmDelete ? "border-fg bg-fg text-bg" : "border-line"
          }`}
        >
          {confirmDelete ? "Tap again to delete" : "Delete task"}
        </button>
      </motion.aside>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-line">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 flex items-center">{children}</dd>
    </div>
  );
}
