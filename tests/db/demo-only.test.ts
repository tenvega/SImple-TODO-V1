import { describe, expect, it } from "vitest";
import { newClient, newUser } from "./helpers";

// The local stack's test inbox (Mailpit), started by `supabase start`.
const MAILPIT = "http://127.0.0.1:54324/api/v1";

async function mailsTo(address: string): Promise<number> {
  const res = await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`to:${address}`)}`);
  return (await res.json()).messages_count;
}

/**
 * TaskFlow is demo-only: every visitor is an anonymous sandbox. Email sign-in
 * is switched off in Supabase Auth, so these paths must be closed at the
 * source, not just hidden in the UI.
 */
describe("demo-only auth", () => {
  it("rejects email sign-ups and magic links", async () => {
    const address = `someone-${crypto.randomUUID()}@taskflow.test`;
    const otp = await newClient().auth.signInWithOtp({ email: address });
    expect(otp.error).not.toBeNull();
    const signUp = await newClient().auth.signUp({ email: address, password: crypto.randomUUID() });
    expect(signUp.error).not.toBeNull();
    expect(await mailsTo(address)).toBe(0);
  });

  it("won't attach an email address to a sandbox", async () => {
    const { db } = await newUser();
    const address = `claim-${crypto.randomUUID()}@taskflow.test`;
    const { error } = await db.auth.updateUser({ email: address });
    expect(error).not.toBeNull();
    // Refused before any email went out (the Send Email hook rejects all mail).
    expect(await mailsTo(address)).toBe(0);
    const { data } = await db.auth.getUser();
    expect(data.user?.is_anonymous).toBe(true);
    expect(data.user?.email ?? "").toBe("");
  });
});
