/** Placeholder rows shown while a list streams in. */
export function TaskListSkeleton({ rows = 5, quickAdd = true }: { rows?: number; quickAdd?: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-7">
      <div className="h-4 w-40 animate-pulse rounded bg-chip" />
      {quickAdd ? <div className="h-12 animate-pulse rounded-xl bg-chip" /> : null}
      <ul>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex min-h-[60px] items-center gap-3 border-b border-line pl-3">
            <span className="size-5 rounded-full bg-chip" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 animate-pulse rounded bg-chip" style={{ width: `${70 - i * 9}%` }} />
              <span className="h-3 w-24 animate-pulse rounded bg-chip" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
