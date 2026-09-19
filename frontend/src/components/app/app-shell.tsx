"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AskQuantora } from "@/components/app/ask-quantora";
import { useAuth } from "@/components/auth/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [askOpen, setAskOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [ready, user, router]);

  if (!ready || !user || !user.onboardingCompleted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen bg-background text-[#ECECE8]">
      <div className="hidden lg:block">
        <AppSidebar onAsk={() => setAskOpen((open) => !open)} />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-40 h-full w-[242px]">
            <AppSidebar
              onAsk={() => {
                setAskOpen(true);
                setMenuOpen(false);
              }}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} onMenu={() => setMenuOpen(true)} />
        {children}
      </main>

      <AskQuantora open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
