import { describe, expect, it } from "vitest";
import { containsPattern } from "./search";

describe("containsPattern", () => {
  it("wraps the query for a contains match", () => {
    expect(containsPattern("  mix ")).toBe("%mix%");
  });

  it("escapes wildcards so they match literally", () => {
    expect(containsPattern("100%_done\\")).toBe("%100\\%\\_done\\\\%");
  });

  it("returns null for empty input and caps length", () => {
    expect(containsPattern("   ")).toBeNull();
    expect(containsPattern("x".repeat(500))!.length).toBe(102);
  });
});
