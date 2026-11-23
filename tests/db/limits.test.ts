import { describe, expect, it } from "vitest";
import { newUser } from "./helpers";

/**
 * Keeps one sandbox from filling the free-plan database. A seeded sandbox
 * uses 53 tasks, 4 tags and 43 focus sessions; these limits are far above
 * that but cap the worst case at about 1 MB per sandbox.
 */
describe("sandbox limits", () => {
  it("stops a sandbox at 300 tasks", async () => {
    const { db } = await newUser();
    const rows = Array.from({ length: 300 }, (_, i) => ({ title: `Task ${i}` }));
    expect((await db.from("tasks").insert(rows)).error).toBeNull();

    const { error } = await db.from("tasks").insert({ title: "one too many" });
    expect(error?.hint).toBe("quota_exceeded");
    const { count } = await db.from("tasks").select("id", { count: "exact", head: true });
    expect(count).toBe(300);
  });

  it("stops a sandbox at 50 tags", async () => {
    const { db } = await newUser();
    const rows = Array.from({ length: 50 }, (_, i) => ({ name: `tag-${i}` }));
    expect((await db.from("tags").insert(rows)).error).toBeNull();
    expect((await db.from("tags").insert({ name: "tag-50" })).error?.hint).toBe("quota_exceeded");
  });

  it("rejects notes over 2,000 characters", async () => {
    const { db } = await newUser();
    const ok = await db.from("tasks").insert({ title: "fits", notes: "x".repeat(2000) });
    expect(ok.error).toBeNull();
    const tooLong = await db.from("tasks").insert({ title: "too long", notes: "x".repeat(2001) });
    expect(tooLong.error?.code).toBe("23514");
  });
});
