"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { SettingsView } from "@/components/settings/settings-view";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      {user ? <SettingsView user={user} /> : null}
    </AppShell>
  );
}
