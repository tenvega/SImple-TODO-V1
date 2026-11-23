import type { Priority } from "@/lib/tasks/types";

const LABEL: Record<Priority, string> = { none: "No priority", low: "Low priority", medium: "Medium priority", high: "High priority" };

/** Priority by lightness and fill, never color alone: solid, gray, ring. */
export function PriorityDot({ priority, label = true }: { priority: Priority; label?: boolean }) {
  if (priority === "none") return null;
  const look =
    priority === "high" ? "bg-fg" : priority === "medium" ? "bg-dot-medium" : "border-[1.5px] border-muted";
  return (
    <>
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${look}`} />
      {label ? <span className="sr-only">{LABEL[priority]}</span> : null}
    </>
  );
}

export const PRIORITY_LABEL: Record<Priority, string> = { none: "None", low: "Low", medium: "Medium", high: "High" };
