"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { startNewTask } from "./command-menu";

/** Floating "+" on phones, above the tab bar. */
export function NewTaskButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="New task"
      onClick={() => startNewTask(router)}
      className="fixed right-4 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-inv text-inv-fg shadow-sheet active:scale-95 md:hidden"
    >
      <PlusIcon size={24} />
    </button>
  );
}
