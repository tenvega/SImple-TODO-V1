import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { DemoButton } from "./demo-button";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-4 text-center">
      <LogoMark size={44} />
      <div className="flex flex-col gap-3">
        <h1 className="text-[40px] leading-tight font-bold tracking-tight">TaskFlow</h1>
        <p className="text-[17px] text-muted">
          Plan your day, focus on one thing at a time, and see how your week went.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DemoButton />
        <Link href="/login" className="text-[15px] font-medium underline underline-offset-4">
          Sign in with email
        </Link>
      </div>
      <p className="max-w-sm text-[13px] text-muted">
        The demo gives you a private sandbox with sample data. Only you can see it, and it clears after 7 days unless you
        keep it with an email.
      </p>
    </main>
  );
}
