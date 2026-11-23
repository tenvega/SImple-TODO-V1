import { expect, test } from "@playwright/test";
import { startDemo } from "./helpers";

test("going offline shows a message instead of breaking the page", async ({ page, context }) => {
  await startDemo(page);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Complete: Pick up dry cleaning" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Couldn't reach the server" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  // The optimistic tick rolls back.
  await expect(page.getByRole("button", { name: "Complete: Pick up dry cleaning" })).toBeVisible();
  await context.setOffline(false);
});

test("closing the details sheet doesn't leave a Back step behind", async ({ page }) => {
  await startDemo(page);
  await page.goto("/upcoming");
  await page.getByRole("button", { name: "Send invoice to Northlight Studio", exact: true }).click();
  await expect(page).toHaveURL(/\?task=/);
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page).toHaveURL(/\/upcoming$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/today$/);
});

test("a linked task outside the current list still opens", async ({ page }) => {
  await startDemo(page);
  await page.getByRole("button", { name: "Review PR: session middleware", exact: true }).click();
  const id = new URL(page.url()).searchParams.get("task");
  // An open task isn't in Completed's list; it still opens by link.
  await page.goto(`/completed?task=${id}`);
  await expect(page.getByRole("dialog", { name: "Details" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("Review PR: session middleware");
});

test("an action after the session expired returns to the landing page", async ({ page, context }) => {
  await startDemo(page);
  await context.clearCookies();
  await page.getByRole("button", { name: "Complete: Pick up dry cleaning" }).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.getByRole("button", { name: "Try the demo" })).toBeVisible();
});
