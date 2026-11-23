import { expect, type Page } from "@playwright/test";

/** Starts a fresh demo sandbox and waits for the seeded Today list. */
export async function startDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("Review PR: session middleware")).toBeVisible();
}

/**
 * Opens the ⌘K menu and searches. Retries the shortcut until the page has
 * hydrated and the menu appears, instead of racing the first keypress.
 */
export async function search(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Search tasks or commands" });
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press("ControlOrMeta+k");
    await expect(input).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await input.fill(text);
}
