"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/auth/auth-provider";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <AppShell>
      <div className="px-10 py-16">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Settings</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Account preferences will live here. You can sign out now.
        </p>
        <button
          type="button"
          className="mt-8 text-sm font-medium text-link hover:text-link-hover"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
