"use client";

import { AppShell } from "@/components/app/app-shell";
import { PlanView } from "@/components/plan/plan-view";

export default function PlanPage() {
  return (
    <AppShell hideHeader>
      <PlanView />
    </AppShell>
  );
}
