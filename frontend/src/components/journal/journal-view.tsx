"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { createJournalEntry, deleteJournalEntry, listJournalEntries, type JournalEntry } from "@/lib/journal";

const inputClass =
  "w-full rounded-[10px] border border-[#1E2228] bg-input px-3.5 py-2.5 text-[14px] text-[#ECECE8] outline-none placeholder:text-faint focus:border-[#3A4270]";

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listJournalEntries();
        if (!cancelled) {
          setEntries(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load journal.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const entry = await createJournalEntry(body);
      setEntries((current) => [entry, ...current]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteJournalEntry(id);
      setEntries((current) => current.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete entry.");
    }
  }

  function formatDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="text-[34px] font-light tracking-[-0.02em] text-[#ECECE8]">Journal</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          A quiet log of decisions, doubts, and reviews — for you, not the market.
        </p>
      </header>

      {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="What did you decide, notice, or question today?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-[10px] bg-cta px-5 py-2.5 text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add entry"}
        </button>
      </form>

      <section>
        {loading ? (
          <div className="flex animate-pulse flex-col gap-3" aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-xl border border-[#1E2228] bg-card" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted">No entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[#1E2228] bg-card px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] text-dim">{formatDate(entry.createdAt)}</div>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#DDDDD8] whitespace-pre-wrap">{entry.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="shrink-0 rounded-lg p-2 text-dim hover:bg-[#1A1D22] hover:text-[#ECECE8]"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={16} strokeWidth={1.7} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
