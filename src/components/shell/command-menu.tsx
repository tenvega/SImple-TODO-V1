"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, PlusIcon, SettingsIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { containsPattern } from "@/lib/tasks/search";
import { NEW_TASK_EVENT, OPEN_PALETTE_EVENT, TASK_NAV, TOOL_NAV } from "./nav";

/** Data only, so the list can be built during render; `run` acts on it. */
type Command = { id: string; label: string; hint?: string; icon?: React.ReactNode; href?: string };

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Starts a new task: focuses quick add on this page, or opens Today to add one. */
export function startNewTask(router: ReturnType<typeof useRouter>) {
  if (document.getElementById("quick-add")) {
    window.dispatchEvent(new Event(NEW_TASK_EVENT));
  } else {
    router.push("/today#new");
  }
}

/**
 * Global keyboard shortcuts and the ⌘K command menu. Task search runs in the
 * browser against Supabase with the visitor's own session, so Row Level
 * Security limits results to their tasks.
 */
export function CommandMenu() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [active, setActive] = useState(0);

  function open() {
    setQuery("");
    setResults([]);
    setActive(0);
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || dialog.current?.open) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        startNewTask(router);
      } else if ((e.key === "f" || e.key === "F") && window.location.pathname !== "/focus") {
        // On the Focus page, F means full screen instead.
        e.preventDefault();
        router.push("/focus");
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, open);
    };
  }, [router]);

  // Debounced task search.
  useEffect(() => {
    const pattern = containsPattern(query);
    if (!pattern) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await createClient()
        .from("tasks")
        .select("id, title, completed_at")
        .ilike("title", pattern)
        .order("completed_at", { ascending: false, nullsFirst: true })
        .limit(8);
      if (!cancelled) {
        setResults((data ?? []).map((t) => ({ id: t.id, title: t.title, done: t.completed_at !== null })));
        setActive(0);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: "new", label: "New task", hint: "N", icon: <PlusIcon size={16} /> },
      ...[...TASK_NAV, ...TOOL_NAV].map((item) => ({
        id: item.href,
        label: `Go to ${item.label}`,
        hint: item.shortcut,
        icon: <item.icon size={16} />,
        href: item.href,
      })),
      { id: "/settings", label: "Go to Settings", icon: <SettingsIcon size={16} />, href: "/settings" },
    ];
    const q = query.trim().toLowerCase();
    const matching = q ? base.filter((c) => c.label.toLowerCase().includes(q)) : base;
    const tasks: Command[] = q
      ? results.map((t) => ({
          id: t.id,
          label: t.title,
          hint: t.done ? "Done" : undefined,
          href: `/${t.done ? "completed" : "all"}?task=${t.id}`,
        }))
      : [];
    return [...tasks, ...matching];
  }, [query, results]);

  function run(command: Command | undefined) {
    if (!command) return;
    close();
    if (command.href) router.push(command.href);
    else startNewTask(router);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(commands[active]);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-label="Command menu"
      onClick={(e) => e.target === dialog.current && close()}
      className="m-auto mt-[12vh] w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-bg p-0 text-fg shadow-sheet backdrop:bg-black/30 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <SearchIcon className="text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!containsPattern(e.target.value)) setResults([]);
          }}
          onKeyDown={onInputKey}
          placeholder="Search tasks or jump to…"
          aria-label="Search tasks or commands"
          aria-controls="command-list"
          aria-activedescendant={commands[active] ? `cmd-${commands[active].id}` : undefined}
          className="h-full flex-1 bg-transparent outline-none focus-visible:outline-none placeholder:text-muted"
        />
        <kbd className="rounded-md border border-line px-1.5 font-sans text-xs text-muted">esc</kbd>
      </div>
      <ul id="command-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {commands.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted">No matches</li> : null}
        {commands.map((c, i) => (
          <li
            key={c.id}
            id={`cmd-${c.id}`}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => run(c)}
            className={`flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px] ${
              i === active ? "bg-chip" : ""
            }`}
          >
            <span className="flex w-4 justify-center text-muted">{c.icon ?? <SearchIcon size={14} />}</span>
            <span className="flex-1 truncate">{c.label}</span>
            {c.hint ? <span className="text-xs text-muted">{c.hint}</span> : null}
          </li>
        ))}
      </ul>
    </dialog>
  );
}
