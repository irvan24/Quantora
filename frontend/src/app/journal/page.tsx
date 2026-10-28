"use client";

import { AppShell } from "@/components/app/app-shell";
import { JournalView } from "@/components/journal/journal-view";

export default function JournalPage() {
  return (
    <AppShell hideHeader>
      <JournalView />
    </AppShell>
  );
}
