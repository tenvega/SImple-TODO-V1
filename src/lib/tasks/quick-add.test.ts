import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./quick-add";

// Tests run with TZ=America/New_York. Saturday Nov 21 2026, 10:00 AM local.
const now = new Date(2026, 10, 21, 10, 0);

describe("parseQuickAdd", () => {
  it("parses the example from the design", () => {
    const r = parseQuickAdd("Call Danielle tomorrow 3pm #work !high", now);
    expect(r.title).toBe("Call Danielle");
    expect(r.dueAt).toEqual(new Date(2026, 10, 22, 15, 0));
    expect(r.dueHasTime).toBe(true);
    expect(r.tags).toEqual(["work"]);
    expect(r.priority).toBe("high");
  });

  it("treats a date without a time as all-day", () => {
    const r = parseQuickAdd("Book dentist friday", now);
    expect(r.title).toBe("Book dentist");
    expect(r.dueAt).toEqual(new Date(2026, 10, 27));
    expect(r.dueHasTime).toBe(false);
  });

  it("drops the joining word left by 'at' or 'on'", () => {
    expect(parseQuickAdd("Standup at 9am", now).title).toBe("Standup");
    expect(parseQuickAdd("Pay rent on Monday", now).title).toBe("Pay rent");
  });

  it("keeps plain text plain", () => {
    const r = parseQuickAdd("Buy 2 cartons of oat milk", now);
    expect(r).toEqual({ title: "Buy 2 cartons of oat milk", dueAt: null, dueHasTime: false, priority: "none", tags: [] });
  });

  it("collects several tags, lowercased and without duplicates", () => {
    const r = parseQuickAdd("Bounce mix #Studio #client-a #studio", now);
    expect(r.title).toBe("Bounce mix");
    expect(r.tags).toEqual(["studio", "client-a"]);
  });

  it("leaves invalid tags and unknown priorities in the title", () => {
    const r = parseQuickAdd("Fix #? !urgent", now);
    expect(r.title).toBe("Fix #? !urgent");
    expect(r.tags).toEqual([]);
    expect(r.priority).toBe("none");
  });

  it("accepts priority shorthands", () => {
    expect(parseQuickAdd("a !1", now).priority).toBe("high");
    expect(parseQuickAdd("a !med", now).priority).toBe("medium");
    expect(parseQuickAdd("a !low", now).priority).toBe("low");
  });

  it("caps tags at ten", () => {
    const many = Array.from({ length: 12 }, (_, i) => `#t${i}`).join(" ");
    expect(parseQuickAdd(`x ${many}`, now).tags).toHaveLength(10);
  });

  it("returns an empty title when only tokens were typed", () => {
    expect(parseQuickAdd("#work tomorrow", now).title).toBe("");
  });
});
