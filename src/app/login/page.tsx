import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4">
      <Link href="/" aria-label="TaskFlow home" className="self-start">
        <LogoMark size={32} />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Sign in</h1>
        <p className="text-muted">We&apos;ll email you a link. No password needed.</p>
      </div>
      <Suspense>
        <EmailForm />
      </Suspense>
    </main>
  );
}
