import { beforeAll, describe, expect, it } from "vitest";
import { newUser, type Client } from "./helpers";

let a: { db: Client; id: string };
let b: { db: Client; id: string };
let aTaskId: string;

const session = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  kind: "work" as const,
  started_at: new Date(Date.now() - 1_500_000).toISOString(),
  ended_at: new Date().toISOString(),
  duration_seconds: 1500,
  ...overrides,
});

beforeAll(async () => {
  a = await newUser();
  b = await newUser();
  const { data } = await a.db.from("tasks").insert({ title: "Mix" }).select("id").single();
  aTaskId = data!.id;
});

describe("focus session logging", () => {
  it("stores a retried log once, by its client-generated ID", async () => {
    const row = session({ task_id: aTaskId });
    expect((await a.db.from("focus_sessions").insert(row)).error).toBeNull();
    const retry = await a.db.from("focus_sessions").insert(row);
    expect(retry.error?.code).toBe("23505");
    const { count } = await a.db.from("focus_sessions").select("id", { count: "exact", head: true }).eq("id", row.id);
    expect(count).toBe(1);
  });

  it("won't let B reuse A's session ID to learn or overwrite anything", async () => {
    const row = session();
    await a.db.from("focus_sessions").insert(row);
    const { error } = await b.db.from("focus_sessions").insert({ ...row, task_id: null });
    expect(error).not.toBeNull();
    const { data } = await b.db.from("focus_sessions").select("id").eq("id", row.id);
    expect(data).toEqual([]);
  });

  it("rejects impossible sessions", async () => {
    const backwards = await a.db.from("focus_sessions").insert(
      session({ started_at: new Date().toISOString(), ended_at: new Date(Date.now() - 1000).toISOString() }),
    );
    expect(backwards.error).not.toBeNull();
    const tooLong = await a.db.from("focus_sessions").insert(session({ duration_seconds: 7201 }));
    expect(tooLong.error).not.toBeNull();
  });
});
