import { describe, expect, it } from "vitest";
import { dayKey, daysBetween, formatDay, formatDue, fromZoned, isValidTimeZone, startOfDay, timeKey } from "./dates";

const NY = "America/New_York";

describe("startOfDay", () => {
  it("finds local midnight in the zone, not in UTC", () => {
    // 01:30 UTC on Nov 22 is still Nov 21 in New York.
    const d = new Date("2026-11-22T01:30:00Z");
    expect(startOfDay(d, NY).toISOString()).toBe("2026-11-21T05:00:00.000Z");
    expect(startOfDay(d, "UTC").toISOString()).toBe("2026-11-22T00:00:00.000Z");
    expect(startOfDay(d, "Asia/Tokyo").toISOString()).toBe("2026-11-21T15:00:00.000Z");
  });

  it("adds days across a DST change", () => {
    // US clocks fall back on Nov 1, 2026.
    const d = new Date("2026-10-31T16:00:00Z");
    expect(startOfDay(d, NY, 1).toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(startOfDay(d, NY, 2).toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });
});

describe("day keys and differences", () => {
  it("uses the zoned calendar day", () => {
    const d = new Date("2026-11-22T03:00:00Z");
    expect(dayKey(d, NY)).toBe("2026-11-21");
    expect(dayKey(d, "UTC")).toBe("2026-11-22");
  });

  it("counts calendar days, not 24-hour blocks", () => {
    const late = new Date("2026-11-22T04:30:00Z"); // 11:30 PM Nov 21 in NY
    const early = new Date("2026-11-22T05:30:00Z"); // 12:30 AM Nov 22 in NY
    expect(daysBetween(late, early, NY)).toBe(1);
  });
});

describe("formatting", () => {
  const now = new Date("2026-11-21T15:00:00Z"); // Sat Nov 21, 10 AM in NY

  it("names nearby days", () => {
    expect(formatDay(new Date("2026-11-21T22:00:00Z"), now, NY)).toBe("Today");
    expect(formatDay(new Date("2026-11-22T15:00:00Z"), now, NY)).toBe("Tomorrow");
    expect(formatDay(new Date("2026-11-20T15:00:00Z"), now, NY)).toBe("Yesterday");
    expect(formatDay(new Date("2026-11-24T15:00:00Z"), now, NY, "long")).toBe("Tuesday");
    expect(formatDay(new Date("2026-11-19T15:00:00Z"), now, NY)).toBe("Thu, Nov 19");
    expect(formatDay(new Date("2027-01-05T15:00:00Z"), now, NY)).toBe("Tue, Jan 5, 2027");
  });

  it("adds the time only when the task has one", () => {
    const due = new Date("2026-11-22T20:00:00Z");
    expect(formatDue(due, true, now, NY)).toBe("Tomorrow, 3:00 PM");
    expect(formatDue(due, false, now, NY)).toBe("Tomorrow");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects anything else", () => {
    expect(isValidTimeZone("Europe/Madrid")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("UTC'; drop table tasks;--")).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
  });
});

describe("fromZoned and timeKey", () => {
  it("round-trips a wall-clock time in the zone", () => {
    const d = fromZoned("2026-11-22", "15:30", NY);
    expect(d.toISOString()).toBe("2026-11-22T20:30:00.000Z");
    expect(timeKey(d, NY)).toBe("15:30");
    expect(dayKey(d, NY)).toBe("2026-11-22");
  });

  it("uses midnight when there is no time", () => {
    expect(fromZoned("2026-07-04", null, NY).toISOString()).toBe("2026-07-04T04:00:00.000Z");
  });
});
