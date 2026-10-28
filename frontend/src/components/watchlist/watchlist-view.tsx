"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RefreshCw, X } from "lucide-react";
import { instrumentPath } from "@/lib/instruments";
import { formatRelativeTime } from "@/lib/research";
import { useResearchWorkspace, type WorkspaceCompany } from "@/lib/research-workspace";

export function WatchlistView() {
  const workspace = useResearchWorkspace();

  if (workspace.loading) {
    return <WatchlistSkeleton />;
  }

  if (workspace.error) {
    return <ErrorState message={workspace.error} onRetry={workspace.reload} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-7 px-4 py-10 sm:px-10">
      <div>
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Watchlist</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Companies you want to follow or research later.
        </p>
      </div>

      {workspace.watchlistError ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#3A2A2A] bg-[#1A1212] px-4 py-2.5 text-[13px] text-[#D7A3A3]">
          <span className="flex-1">{workspace.watchlistError}</span>
          <button type="button" onClick={workspace.dismissWatchlistError} className="text-[#D7A3A3] hover:text-[#ECECE8]">
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}

      {workspace.watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-[15px] text-muted">Your watchlist is empty.</p>
          <Link
            href="/research"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-link hover:text-link-hover"
          >
            Find a company to research
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {workspace.watchlist.map((company) => (
            <WatchlistRow key={company.symbol} company={company} onRemove={workspace.toggleWatchlist} />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[920px] animate-pulse flex-col gap-7 px-4 py-10 sm:px-10" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3">
        <div className="h-7 w-32 rounded-md bg-card" />
        <div className="h-4 w-72 max-w-full rounded bg-card" />
      </div>
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[52px] rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col items-center gap-4 px-4 py-24 text-center sm:px-10">
      <h1 className="text-[22px] font-normal tracking-[-0.01em] text-[#ECECE8]">Could not load your watchlist</h1>
      <p className="max-w-md text-[14.5px] leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex h-[38px] items-center gap-2 rounded-[10px] bg-[#16191D] px-4 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#1C2027] hover:text-[#ECECE8]"
      >
        <RefreshCw size={14} strokeWidth={1.9} />
        Try again
      </button>
    </div>
  );
}

function WatchlistRow({
  company,
  onRemove,
}: {
  company: WorkspaceCompany;
  onRemove: (symbol: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await onRemove(company.symbol);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 border-b border-[#131518] py-3.5">
      <Link href={instrumentPath(company.symbol)} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#191C21] text-[13.5px] font-semibold text-muted">
          {company.initial}
        </div>
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[14.5px] font-medium text-[#ECECE8]">{company.name}</span>
            <span className="text-xs font-semibold tracking-[0.02em] text-faint">{company.symbol}</span>
          </span>
          <span className="mt-0.5 block text-xs text-faint">
            {company.sector ?? "—"} · {company.stageLabel}
            {company.lastActivity ? ` · ${formatRelativeTime(company.lastActivity)}` : ""}
          </span>
        </span>
      </Link>
      <Link
        href={company.nextHref}
        className="hidden h-[32px] items-center rounded-[8px] px-3 text-[13px] font-semibold text-link hover:bg-[#16191D] hover:text-link-hover sm:flex"
      >
        {company.hasThesis ? "Open thesis" : "Continue"}
      </Link>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        title="Remove from watchlist"
        aria-label="Remove from watchlist"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-faint hover:bg-[#16191D] hover:text-[#ECECE8] disabled:opacity-50"
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}
