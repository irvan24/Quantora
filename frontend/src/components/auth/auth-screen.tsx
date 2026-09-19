"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthForm, AuthSwitch } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { postAuthPath } from "@/lib/auth";

export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && user) {
      router.replace(postAuthPath(user));
    }
  }, [ready, user, router]);

  if (!ready || user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen bg-background text-[#ECECE8]">
      <AuthBrandPanel />
      <main className="flex min-w-0 flex-[1_1_54%] flex-col px-6 py-7 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 lg:justify-end">
          <Link href="/login" className="flex items-center gap-2.5 text-[#ECECE8] lg:hidden">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#191C21] text-[13px] font-semibold text-link">
              Q
            </span>
            <span className="text-[12.5px] font-semibold tracking-[0.17em]">QUANTORA</span>
          </Link>
          <AuthSwitch mode={mode} />
        </div>
        <div className="my-auto w-full">
          <AuthForm mode={mode} />
        </div>
      </main>
    </div>
  );
}
