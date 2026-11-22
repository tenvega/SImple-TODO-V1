"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, PlusIcon } from "@/components/icons";
import { NEW_TASK_EVENT } from "@/components/shell/nav";
import { formatDue } from "@/lib/dates";
import { parseQuickAdd, type QuickAdd } from "@/lib/tasks/quick-add";
import { PRIORITY_LABEL, PriorityDot } from "./priority-dot";
import { useMediaQuery } from "./use-media-query";

type Props = {
  /** Applied when the text names no date, e.g. "today" in the Today view. */
  defaultDue: Date | null;
  timeZone: string;
  onAdd: (task: QuickAdd) => void;
};

export function QuickAddBar({ defaultDue, timeZone, onAdd }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const roomy = useMediaQuery("(min-width: 640px)");
  const [text, setText] = useState("");
  const parsed = useMemo(() => {
    const p = parseQuickAdd(text);
    return p.dueAt || !defaultDue ? p : { ...p, dueAt: defaultDue, dueHasTime: false };
  }, [text, defaultDue]);
  const hasExtras = parsed.dueAt !== null || parsed.tags.length > 0 || parsed.priority !== "none";

  useEffect(() => {
    const focus = () => input.current?.focus();
    window.addEventListener(NEW_TASK_EVENT, focus);
    // Arriving from the N shortcut on another page.
    if (window.location.hash === "#new") {
      focus();
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    }
    return () => window.removeEventListener(NEW_TASK_EVENT, focus);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.title) return;
    onAdd(parsed);
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <label htmlFor="quick-add" className="sr-only">
        Quick add
      </label>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-line px-3.5 transition-colors focus-within:border-fg">
        <PlusIcon className="shrink-0" />
        <input
          ref={input}
          id="quick-add"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && (setText(""), e.currentTarget.blur())}
          placeholder={roomy ? "Add a task — try “Call Danielle tomorrow 3pm #work !high”" : "Add a task"}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent outline-none focus-visible:outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-sans text-xs text-muted sm:block">↵</kbd>
      </div>
      <AnimatePresence initial={false}>
        {text.trim() && hasExtras ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            aria-live="polite"
            className="flex flex-wrap items-center gap-2 overflow-hidden text-[13px]"
          >
            <span className="text-muted">Will add</span>
            {parsed.dueAt ? (
              <Chip>
                <CalendarIcon size={13} strokeWidth={2} />
                {formatDue(parsed.dueAt, parsed.dueHasTime, new Date(), timeZone)}
              </Chip>
            ) : null}
            {parsed.tags.map((t) => (
              <Chip key={t}>#{t}</Chip>
            ))}
            {parsed.priority !== "none" ? (
              <Chip>
                <PriorityDot priority={parsed.priority} label={false} />
                {PRIORITY_LABEL[parsed.priority]}
              </Chip>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="flex h-[26px] items-center gap-1.5 rounded-full bg-chip px-2.5">{children}</span>;
}
