"use client";

import { AppShell } from "@/components/app/app-shell";
import { LearnCatalog } from "@/components/learn/learn-catalog";

export default function LearnPage() {
  return (
    <AppShell hideHeader>
      <LearnCatalog />
    </AppShell>
  );
}
