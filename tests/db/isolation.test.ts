import { beforeAll, describe, expect, it } from "vitest";
import { newClient, newUser, type Client } from "./helpers";

/**
 * Proves the core security property of TaskFlow: user B can never read or
 * change user A's data, whatever IDs B sends. These run against the real
 * Postgres policies, not mocks.
 */
let a: { db: Client; id: string };
let b: { db: Client; id: string };
let aTaskId: string;
let aTagId: string;
let bTaskId: string;

beforeAll(async () => {
  a = await newUser();
  b = await newUser();

  const { data: aTask, error } = await a.db
    .from("tasks")
    .insert({ title: "A's private task", priority: "high" })
    .select("id, user_id")
    .single();
  if (error) throw error;
  aTaskId = aTask.id;

  const { data: aTag } = await a.db.from("tags").insert({ name: "secret" }).select("id").single();
  aTagId = aTag!.id;
  await a.db.from("task_tags").insert({ task_id: aTaskId, tag_id: aTagId });
  await a.db.from("focus_sessions").insert({
    task_id: aTaskId,
    started_at: new Date(Date.now() - 1_500_000).toISOString(),
    ended_at: new Date().toISOString(),
    duration_seconds: 1500,
  });

  const { data: bTask } = await b.db.from("tasks").insert({ title: "B's task" }).select("id").single();
  bTaskId = bTask!.id;
});

describe("ownership is derived from the session", () => {
  it("sets user_id from the JWT without the client sending it", async () => {
    const { data } = await a.db.from("tasks").select("user_id").eq("id", aTaskId).single();
    expect(data?.user_id).toBe(a.id);
  });
});

describe("user B cannot read user A's data", () => {
  it("does not list A's tasks", async () => {
    const { data, error } = await b.db.from("tasks").select("id");
    expect(error).toBeNull();
    expect(data?.map((t) => t.id)).not.toContain(aTaskId);
  });

  it("gets nothing when asking for A's task by ID", async () => {
    const { data } = await b.db.from("tasks").select("*").eq("id", aTaskId);
    expect(data).toEqual([]);
  });

  it("cannot see A's tags, task links, focus sessions or profile", async () => {
    const [tags, links, sessions, profile] = await Promise.all([
      b.db.from("tags").select("id").eq("id", aTagId),
      b.db.from("task_tags").select("task_id").eq("task_id", aTaskId),
      b.db.from("focus_sessions").select("id").eq("task_id", aTaskId),
      b.db.from("profiles").select("id").eq("id", a.id),
    ]);
    expect(tags.data).toEqual([]);
    expect(links.data).toEqual([]);
    expect(sessions.data).toEqual([]);
    expect(profile.data).toEqual([]);
  });
});

describe("user B cannot modify user A's data", () => {
  it("updates zero rows when editing A's task", async () => {
    const { data } = await b.db.from("tasks").update({ title: "hacked" }).eq("id", aTaskId).select();
    expect(data).toEqual([]);
    const { data: still } = await a.db.from("tasks").select("title").eq("id", aTaskId).single();
    expect(still?.title).toBe("A's private task");
  });

  it("deletes zero rows when deleting A's task", async () => {
    const { data } = await b.db.from("tasks").delete().eq("id", aTaskId).select();
    expect(data).toEqual([]);
    const { count } = await a.db.from("tasks").select("id", { count: "exact", head: true }).eq("id", aTaskId);
    expect(count).toBe(1);
  });

  it("cannot create a task owned by A (no mass assignment of user_id)", async () => {
    const { error } = await b.db.from("tasks").insert({ title: "planted", user_id: a.id });
    expect(error?.code).toBe("42501");
  });

  it("cannot move its own task into A's account", async () => {
    const { error } = await b.db.from("tasks").update({ user_id: a.id }).eq("id", bTaskId);
    expect(error).not.toBeNull();
    const { data } = await b.db.from("tasks").select("user_id").eq("id", bTaskId).single();
    expect(data?.user_id).toBe(b.id);
  });

  it("cannot tag its task with A's tag", async () => {
    const { error } = await b.db.from("task_tags").insert({ task_id: bTaskId, tag_id: aTagId });
    expect(error).not.toBeNull();
  });

  it("cannot log focus time against A's task", async () => {
    const { error } = await b.db.from("focus_sessions").insert({
      task_id: aTaskId,
      started_at: new Date(Date.now() - 60_000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 60,
    });
    expect(error).not.toBeNull();
  });

  it("cannot rename A's profile", async () => {
    const { data } = await b.db.from("profiles").update({ display_name: "hacked" }).eq("id", a.id).select();
    expect(data).toEqual([]);
  });
});

describe("signed-out visitors", () => {
  it("cannot read any table", async () => {
    const anon = newClient();
    for (const table of ["tasks", "tags", "task_tags", "focus_sessions", "profiles"] as const) {
      const { data, error } = await anon.from(table).select("*").limit(1);
      expect(error?.code, table).toBe("42501");
      expect(data).toBeNull();
    }
  });

  it("cannot seed a sandbox", async () => {
    const { error } = await newClient().rpc("seed_sandbox", { p_time_zone: "UTC" });
    expect(error).not.toBeNull();
  });
});

describe("demo sandbox seed", () => {
  it("seeds only the caller's account, once", async () => {
    const c = await newUser();
    const before = await a.db.from("tasks").select("id", { count: "exact", head: true });

    expect((await c.db.rpc("seed_sandbox", { p_time_zone: "America/New_York" })).error).toBeNull();
    const first = await c.db.from("tasks").select("user_id");
    expect(first.data!.length).toBeGreaterThan(20);
    expect(new Set(first.data!.map((t) => t.user_id))).toEqual(new Set([c.id]));

    const sessions = await c.db.from("focus_sessions").select("id", { count: "exact", head: true });
    expect(sessions.count).toBeGreaterThan(10);

    // Second call is a no-op.
    await c.db.rpc("seed_sandbox", { p_time_zone: "UTC" });
    const second = await c.db.from("tasks").select("id", { count: "exact", head: true });
    expect(second.count).toBe(first.data!.length);

    // A's data is untouched.
    const after = await a.db.from("tasks").select("id", { count: "exact", head: true });
    expect(after.count).toBe(before.count);
  });

  it("falls back to UTC for an unknown time zone", async () => {
    const d = await newUser();
    const { error } = await d.db.rpc("seed_sandbox", { p_time_zone: "Not/AZone'; drop table tasks;--" });
    expect(error).toBeNull();
  });
});

describe("privileged functions are not reachable from the API", () => {
  it("cannot call the sandbox cleanup job", async () => {
    const { error } = await b.db.schema("private" as "public").rpc("delete_stale_sandboxes" as "seed_sandbox");
    expect(error).not.toBeNull();
  });
});
