"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.email().max(254);

export function EmailForm() {
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "That link has expired or was already used. Request a new one." : null,
  );

  function submit(formData: FormData) {
    const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
      });
      // Same message whether or not the address has an account, so the form
      // can't be used to discover who is registered.
      if (otpError && otpError.status === 429) {
        setError("Too many requests. Wait a minute and try again.");
        return;
      }
      setSentTo(parsed.data);
    });
  }

  if (sentTo) {
    return (
      <p role="status" className="rounded-xl border border-line p-4 text-[15px]">
        If <strong className="font-semibold">{sentTo}</strong> can sign in, a link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="email" className="text-[13px] font-medium text-muted">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        className="h-12 rounded-xl border border-line bg-bg px-4 text-[15px] outline-none focus:border-fg"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-inv text-[15px] font-semibold text-inv-fg disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a link"}
      </button>
      <p role="alert" className="min-h-5 text-[13px] text-muted">
        {error}
      </p>
    </form>
  );
}
