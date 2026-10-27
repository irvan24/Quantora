"use client";

import { AppShell } from "@/components/app/app-shell";
import { EditPlanForm } from "@/components/plan/edit-plan-form";

export default function EditPlanPage() {
  return (
    <AppShell hideHeader>
      <EditPlanForm />
    </AppShell>
  );
}
