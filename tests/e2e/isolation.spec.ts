import { expect, test } from "@playwright/test";
import { search, startDemo } from "./helpers";

/** The same promise as the database tests, through the real UI and two real browsers. */
test("two visitors never see each other's tasks", async ({ browser }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await startDemo(alice);
  await startDemo(bob);

  const secret = `Alice's secret ${Date.now()}`;
  const quickAdd = alice.getByRole("textbox", { name: "Quick add" });
  await quickAdd.fill(secret);
  await quickAdd.press("Enter");
  await alice.goto("/all");
  await expect(alice.getByText(secret)).toBeVisible();

  // Bob's lists and search don't include it.
  await bob.goto("/all");
  await expect(bob.getByText("Review PR: session middleware")).toBeVisible();
  await expect(bob.getByText(secret)).toHaveCount(0);
  // Search works for Bob's own tasks (so "No matches" below means something)...
  await search(bob, "Foley");
  await expect(bob.getByRole("option", { name: /Foley session/ })).toBeVisible({ timeout: 10_000 });
  // ...but finds nothing of Alice's.
  await bob.getByRole("textbox", { name: "Search tasks or commands" }).fill("Alice's secret");
  await expect(bob.getByText("No matches")).toBeVisible();

  // Even with the task's ID in the URL, Bob gets no details sheet.
  await alice.getByText(secret).click();
  const id = new URL(alice.url()).searchParams.get("task");
  expect(id).toBeTruthy();
  await bob.goto(`/all?task=${id}`);
  await expect(bob.getByRole("dialog", { name: "Details" })).toHaveCount(0);
});
