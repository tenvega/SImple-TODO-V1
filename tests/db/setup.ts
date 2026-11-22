import { existsSync } from "node:fs";

// Locally the keys come from .env.local; CI writes the same file from
// `supabase status` before running the suite.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Start Supabase (npx supabase start) and create .env.local before running db tests.");
}
