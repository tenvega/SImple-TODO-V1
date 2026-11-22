import { describe, expect, it } from "vitest";
import { newUser } from "./helpers";

/**
 * Keeping a sandbox with email must prove the visitor owns the address.
 * Otherwise anyone could claim someone else's email, blocking the real owner
 * and leaving planted data waiting in "their" account.
 */
describe("upgrading a sandbox to an email account", () => {
  it("holds the email as pending until the link is opened", async () => {
    const { db } = await newUser();
    const address = `owner-${crypto.randomUUID()}@taskflow.test`;

    const { data, error } = await db.auth.updateUser({ email: address });
    expect(error).toBeNull();
    expect(data.user?.email ?? "").toBe("");
    expect(data.user?.new_email).toBe(address);
    expect(data.user?.is_anonymous).toBe(true);
  });
});
