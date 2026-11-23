"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { seedSandbox } from "@/app/actions/session";
import { createClient } from "@/lib/supabase/client";

/**
 * Creates a private, anonymous sandbox for this visitor. There is no shared
 * demo account and no demo password.
 */
export function DemoButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        setError(
          signInError.status === 429
            ? "Too many demo sessions from this network. Try again in a bit."
            : "Couldn't start the demo. Try again.",
        );
        return;
      }
      await seedSandbox(Intl.DateTimeFormat().resolvedOptions().timeZone);
      router.replace("/today");
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="h-11 min-w-44 rounded-xl bg-inv px-5 text-[15px] font-semibold text-inv-fg transition-opacity disabled:opacity-60"
      >
        {pending ? "Setting up your sandbox…" : "Try the demo"}
      </button>
      <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-muted">
        {error}
      </p>
    </div>
  );
}
