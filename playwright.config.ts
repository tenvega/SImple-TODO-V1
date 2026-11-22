import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);

/**
 * End-to-end tests against the real app and the local Supabase stack.
 * Locally they reuse a running `npm run dev`; CI builds and serves production.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], timezoneId: "America/New_York" } },
    { name: "phone", use: { ...devices["Pixel 7"], timezoneId: "Europe/Madrid" }, testMatch: /demo\.spec/ },
  ],
  webServer: {
    command: CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
