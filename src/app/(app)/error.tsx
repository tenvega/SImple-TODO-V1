"use client";

/**
 * Shown when a page in the app fails to load. Never shows the error itself:
 * in production Next.js only sends a digest to the browser, and the message
 * here stays generic either way.
 */
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-10">
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted">This page couldn&apos;t load. Your tasks are safe; try again in a moment.</p>
      <button type="button" onClick={retry} className="h-11 rounded-xl bg-inv px-5 font-semibold text-inv-fg">
        Try again
      </button>
    </div>
  );
}
