import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/actions/session";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Today" };

// Temporary scaffold screen that proves auth, RLS and the sandbox seed work
// end to end. The real Today view (list, quick add, details sheet) replaces
// it in the Tasks stage.
export default function TodayPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-12">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Today</h1>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-chip" />}>
        <SessionSummary />
      </Suspense>
    </main>
  );
}

async function SessionSummary() {
  const user = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true });

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line p-5">
      <p>
        Signed in {user.isAnonymous ? "to a private demo sandbox" : `as ${user.email}`}. You can see{" "}
        <strong className="font-semibold">{count ?? 0}</strong> tasks, all your own.
      </p>
      <form action={signOut}>
        <button type="submit" className="h-11 rounded-xl border border-line px-4 font-medium">
          Sign out
        </button>
      </form>
    </section>
  );
}
