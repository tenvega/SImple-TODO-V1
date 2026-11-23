import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/actions/session";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[34px] leading-tight font-bold tracking-tight">Settings</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-chip" />}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  await requireUser();
  return (
    <>
      <section aria-labelledby="account-h" className="flex flex-col gap-4 rounded-2xl border border-line p-5">
        <h2 id="account-h" className="font-semibold">
          Demo sandbox
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;re using a private sandbox. Only you can see its tasks, and it&apos;s deleted after 7 days.
        </p>
      </section>
      <form action={signOut}>
        <button type="submit" className="h-11 rounded-xl border border-line px-5 font-medium">
          End demo
        </button>
      </form>
      <p className="-mt-5 text-[13px] text-muted">
        This signs you out of the sandbox for good; you can always start a fresh one.
      </p>
    </>
  );
}
