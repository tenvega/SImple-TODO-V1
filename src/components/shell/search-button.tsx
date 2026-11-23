"use client";

import { SearchIcon } from "@/components/icons";
import { OPEN_PALETTE_EVENT } from "./nav";

export function SearchButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      className="mb-3 flex h-9 items-center gap-2 rounded-[10px] border border-line bg-bg px-2.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <SearchIcon size={16} />
      <span className="flex-1 text-left">Search</span>
      <kbd className="rounded-md border border-line px-1.5 py-0.5 font-sans text-xs">⌘K</kbd>
    </button>
  );
}
