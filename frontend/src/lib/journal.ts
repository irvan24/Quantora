import { api } from "@/lib/auth";

export type JournalEntry = {
  id: number;
  body: string;
  createdAt: string;
};

export async function listJournalEntries() {
  return api<JournalEntry[]>("/api/journal");
}

export async function createJournalEntry(body: string) {
  return api<JournalEntry>("/api/journal", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteJournalEntry(id: number) {
  return api<void>(`/api/journal/${id}`, { method: "DELETE" });
}
