import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment. Importing this module (next.config.ts does) makes
 * `next dev`, `next build` and `next start` fail immediately with a clear
 * message when a required variable is missing or malformed. There are no
 * hard-coded fallbacks.
 *
 * The app only ever holds the *publishable* Supabase key. Access control is
 * enforced by Row Level Security in Postgres, so no service-role or secret
 * key is needed (or allowed) in the web app.
 */
export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .min(20)
      .refine((key) => !key.startsWith("sb_secret_"), {
        message: "Use the publishable key here, never the secret key.",
      }),
    NEXT_PUBLIC_SITE_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  emptyStringAsUndefined: true,
});
