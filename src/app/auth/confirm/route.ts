import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const otpTypes = ["magiclink", "email", "signup", "email_change", "invite", "recovery"] as const;

const querySchema = z.object({
  code: z.string().min(1).max(512).optional(),
  token_hash: z.string().min(1).max(512).optional(),
  type: z.enum(otpTypes).optional(),
  // Only same-site relative paths, so this can't become an open redirect.
  next: z
    .string()
    .regex(/^\/(?!\/)[\w\-/]*$/)
    .max(64)
    .catch("/today"),
});

/** Landing point for magic links and email confirmations. */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse({ next: "/today", ...params });
  const fail = new URL("/login?error=link", request.url);

  if (!parsed.success) {
    return NextResponse.redirect(fail);
  }

  const { code, token_hash, type, next } = parsed.data;
  const supabase = await createClient();

  let error: unknown = new Error("No credentials in link");
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (token_hash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType }));
  }

  if (error) {
    return NextResponse.redirect(fail);
  }

  return NextResponse.redirect(new URL(next ?? "/today", request.url));
}
