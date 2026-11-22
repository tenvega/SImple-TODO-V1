import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
          // A zone with DST, so day math is tested across clock changes.
          env: { TZ: "America/New_York" },
        },
        resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
      },
      {
        test: {
          name: "db",
          include: ["tests/db/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/db/setup.ts"],
          // These talk to the local Supabase stack (npx supabase start).
          testTimeout: 20_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
