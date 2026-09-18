"use client";

import { AppShell } from "@/components/app/app-shell";
import { HomeDashboard } from "@/components/app/home-empty";
import { useAuth } from "@/components/auth/auth-provider";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppShell>
      {user ? <HomeDashboard user={user} /> : null}
    </AppShell>
  );
}
