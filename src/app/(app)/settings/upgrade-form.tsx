"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.email().max(254);

/**
 * Turns the anonymous sandbox into a permanent account by attaching an email.
 * The account (and every task in it) stays the same user; Supabase only marks
 * it permanent once the link in the email is opened.
 */
export function UpgradeForm() {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: updateError } = await createClient().auth.updateUser(
        { email: parsed.data },
        { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/settings` },
      );
      if (updateError?.status === 429) {
        setError("Too many requests. Wait a minute and try again.");
      } else if (updateError?.code === "email_exists") {
        setError("That email already has an account. Sign out, then sign in with it.");
      } else if (updateError) {
        setError("Couldn't send the link. Try again.");
      } else {
        setSentTo(parsed.data);
      }
    });
  }

  if (sentTo) {
    return (
      <p role="status" className="rounded-xl border border-line p-4">
        Check <strong className="font-semibold">{sentTo}</strong> and open the link to keep your tasks.
      </p>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="upgrade-email" className="text-[13px] font-medium text-muted">
        Email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="upgrade-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="h-11 flex-1 rounded-xl border border-line bg-bg px-4 outline-none focus:border-fg"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-inv px-5 font-semibold text-inv-fg disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send link"}
        </button>
      </div>
      <p role="alert" className="min-h-5 text-[13px] text-muted">
        {error}
      </p>
    </form>
  );
}
