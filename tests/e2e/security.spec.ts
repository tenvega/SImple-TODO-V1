import { expect, test } from "@playwright/test";

test.describe("security baseline", () => {
  test("sends strict security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("sends signed-out visitors from app pages to the landing page", async ({ page }) => {
    for (const path of ["/today", "/all", "/focus", "/insights", "/settings"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/$/);
    }
  });

});
