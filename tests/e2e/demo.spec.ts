import { expect, test } from "@playwright/test";
import { search, startDemo } from "./helpers";

test("demo: add, edit, complete and find tasks", async ({ page, isMobile }) => {
  await startDemo(page);

  // Natural-language quick add, previewed before saving.
  const title = `Restring guitar ${Date.now()}`;
  const quickAdd = page.getByRole("textbox", { name: "Quick add" });
  await quickAdd.fill(`${title} tomorrow 5pm #studio !high`);
  await expect(page.getByText("Will add")).toBeVisible();
  await expect(page.getByText("Tomorrow, 5:00 PM")).toBeVisible();
  await quickAdd.press("Enter");
  // It belongs in Upcoming, so Today says where it went once it's saved.
  await expect(page.getByRole("status").filter({ hasText: "Added to Upcoming" })).toBeVisible();

  await page.goto("/upcoming");
  const row = page.getByRole("listitem").filter({ hasText: title });
  await expect(row).toContainText("5:00 PM");
  await expect(row).toContainText("#studio");

  // Edit in the details sheet; changes save when it closes.
  await row.getByRole("button", { name: title, exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Details" });
  await sheet.getByRole("radio", { name: "Low" }).click();
  await sheet.getByRole("button", { name: "Close details" }).click();
  await expect(sheet).toBeHidden();
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText("Low priority");

  // Complete it; it leaves Upcoming and shows in Completed.
  await page.getByRole("button", { name: `Complete: ${title}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toHaveCount(0);
  await page.goto("/completed");
  await expect(page.getByText(title)).toBeVisible();

  // Search across lists (keyboard shortcut on desktop, menu on phones).
  if (!isMobile) {
    await page.goto("/today");
    await search(page, "Foley");
    await expect(page.getByRole("option", { name: /Foley session/ })).toBeVisible({ timeout: 10_000 });
  }
});

test("focus: start a session from a task", async ({ page }) => {
  await startDemo(page);
  await page.getByRole("button", { name: "Mix stems for trailer cue", exact: true }).click();
  await page.getByRole("link", { name: "Start focus" }).click();

  await expect(page).toHaveURL(/\/focus\?task=/);
  const taskId = new URL(page.url()).searchParams.get("task")!;
  await expect(page.getByRole("combobox")).toHaveValue(taskId);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page).toHaveTitle(/^2\d:\d\d · Work$/);
});

test("insights: summary, cards and chart", async ({ page }) => {
  await startDemo(page);
  await page.goto("/insights");
  await expect(page.getByText(/You finished \d+ tasks? this week/)).toBeVisible();
  for (const card of ["Tasks done", "Focus time", "Streak", "Completion rate"]) {
    await expect(page.getByText(card, { exact: true })).toBeVisible();
  }
  const bars = page.getByRole("region", { name: "Tasks completed" }).getByRole("button");
  await expect(bars).toHaveCount(7);
  await bars.last().click();
  await expect(page.getByRole("status").filter({ hasText: "Today" })).toBeVisible();

  await page.getByRole("link", { name: "Month" }).click();
  await expect(page).toHaveURL(/range=month/);
  await expect(page.getByRole("region", { name: "Tasks completed" }).getByRole("button")).toHaveCount(30);
});
