"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RefreshCw, Star, X } from "lucide-react";
import { InstrumentSearch } from "@/components/app/instrument-search";
import { instrumentPath, instrumentResearchPath } from "@/lib/instruments";
import { formatRelativeTime } from "@/lib/research";
import { useResearchWorkspace, type WorkspaceCompany } from "@/lib/research-workspace";

const STEPS = [
  { title: "Find a company", desc: "Search any company you’re curious about." },
  { title: "Understand the business", desc: "What it sells and how it makes money." },
  { title: "Analyze financials", desc: "Is it growing, profitable and resilient?" },
  { title: "Estimate valuation", desc: "Compare the price with what the business earns." },
  { title: "Research deeper", desc: "Weigh the strengths against the risks." },
  { title: "Build your thesis", desc: "Write down what you believe, and why." },
];

export function ResearchHome() {
  const workspace = useResearchWorkspace();

  if (workspace.loading) {
    return <ResearchSkeleton />;
  }

  if (workspace.error) {
    return <ErrorState message={workspace.error} onRetry={workspace.reload} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 py-8 sm:px-10">
      {workspace.isEmpty ? <EmptyHero /> : <ActiveHero stats={workspace.stats} />}

      {workspace.watchlistError ? (
        <WatchlistErrorBanner message={workspace.watchlistError} onDismiss={workspace.dismissWatchlistError} />
      ) : null}

      {workspace.isEmpty ? (
        <EmptyBody />
      ) : (
        <div className="flex flex-col gap-[52px]">
          {workspace.continueCards.length > 0 ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Continue your research</h2>
                <span className="text-[12.5px] text-faint">Pick up where you stopped</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
                {workspace.continueCards.map((company) => (
                  <ContinueCard key={company.symbol} company={company} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Your watchlist</h2>
              <span className="text-[12.5px] text-faint">Companies you want to follow or research later</span>
            </div>
            <WatchlistTable workspace={workspace} />
          </section>

          {workspace.discover.length > 0 ? (
            <section className="flex flex-col gap-4 border-t border-line pt-7">
              <div>
                <h2 className="text-[15px] font-medium text-muted">More you’ve looked at</h2>
                <span className="text-[12.5px] text-faint">Not on your watchlist yet</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
                {workspace.discover.map((company) => (
                  <DiscoverTile key={company.symbol} company={company} onToggle={workspace.toggleWatchlist} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <div className="mt-6 text-[12.5px] text-faint">
        Quantora keeps your reasoning organised. Conclusions and decisions remain yours.
      </div>
    </div>
  );
}

function ResearchSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] animate-pulse flex-col gap-4 px-4 py-8 sm:px-10" aria-busy="true" aria-live="polite">
      <section className="flex flex-col gap-5 pt-2 pb-2">
        <div className="flex flex-col gap-3">
          <div className="h-7 w-40 rounded-md bg-card" />
          <div className="h-4 w-80 max-w-full rounded bg-card" />
        </div>
        <div className="h-[58px] w-full max-w-[680px] rounded-[14px] bg-card" />
        <div className="flex flex-wrap items-center gap-x-9 gap-y-2 border-t border-b border-line py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-6 w-10 rounded bg-card" />
              <div className="h-3 w-24 rounded bg-card" />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="h-5 w-48 rounded bg-card" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-[14px] bg-card" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="h-5 w-32 rounded bg-card" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[52px] rounded-xl bg-card" />
          ))}
        </div>
      </section>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-4 px-4 py-24 text-center sm:px-10">
      <h1 className="text-[22px] font-normal tracking-[-0.01em] text-[#ECECE8]">Could not load your research</h1>
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

function WatchlistErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#3A2A2A] bg-[#1A1212] px-4 py-2.5 text-[13px] text-[#D7A3A3]">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="text-[#D7A3A3] hover:text-[#ECECE8]">
        <X size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function EmptyHero() {
  return (
    <section className="flex flex-col items-center gap-[14px] pt-10 pb-2 text-center">
      <div className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">Research</div>
      <h1 className="max-w-[640px] text-[36px] font-light tracking-[-0.025em] text-[#ECECE8]">
        Build conviction before you invest.
      </h1>
      <p className="max-w-[500px] text-[15.5px] leading-relaxed text-muted">
        Understand a company, analyze its fundamentals and build your own investment thesis.
      </p>
      <div className="mt-5 flex w-full justify-center">
        <InstrumentSearch toPath={instrumentPath} variant="hero" placeholder="Search a company or ticker…" autoFocus />
      </div>
      <p className="mt-2 text-[13px] text-faint">Try a company you already know, like Apple or Microsoft.</p>
    </section>
  );
}

function ActiveHero({
  stats,
}: {
  stats: { researched: number; activeTheses: number; needingReview: number; onWatchlist: number };
}) {
  return (
    <section className="flex flex-col gap-5 pt-2 pb-2">
      <div>
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Research</h1>
        <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-muted">
          Research companies, build conviction and turn your analysis into an investment thesis.
        </p>
      </div>
      <InstrumentSearch toPath={instrumentPath} variant="hero" placeholder="Search a company or ticker…" />
      <div className="flex flex-wrap items-center gap-x-9 gap-y-2 border-t border-b border-line py-4">
        <StatLink n={stats.researched} label="Companies researched" href="#" />
        <StatLink n={stats.activeTheses} label="Active theses" href="/theses" />
        <StatLink n={stats.needingReview} label="Theses to review" href="/theses" warn={stats.needingReview > 0} />
        <StatLink n={stats.onWatchlist} label="On watchlist" href="/watchlist" />
      </div>
    </section>
  );
}

function StatLink({ n, label, href, warn }: { n: number; label: string; href: string; warn?: boolean }) {
  return (
    <Link href={href} className="flex items-baseline gap-2.5 hover:opacity-80">
      <span className="text-[22px] font-light tracking-[-0.01em] text-[#ECECE8]">{n}</span>
      <span className={`text-[12.5px] ${warn ? "text-[#C9B08E]" : "text-dim"}`}>{label}</span>
    </Link>
  );
}

function EmptyBody() {
  return (
    <div className="flex flex-col gap-16 pt-3">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">How research works in Quantora</h2>
          <p className="text-[13.5px] text-muted">Six steps, one company at a time. Quantora guides you through each one.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`rounded-[14px] px-4 py-4.5 ${index === 0 ? "border border-[#1E2330] bg-card" : "border border-line"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold tracking-[0.04em] ${index === 0 ? "text-link" : "text-faint"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="mt-4 text-[14.5px] font-semibold leading-snug text-[#ECECE8]">{step.title}</div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function stageSegments(stageFilled: number) {
  return Array.from({ length: 5 }, (_, i) => i < stageFilled);
}

function Segments({ stageFilled, height = 3 }: { stageFilled: number; height?: number }) {
  return (
    <div className="flex gap-[3px]">
      {stageSegments(stageFilled).map((filled, index) => (
        <span
          key={index}
          className="block flex-1 rounded-sm"
          style={{ height, background: filled ? "#8E9CE0" : "#1E2228" }}
        />
      ))}
    </div>
  );
}

function ContinueCard({ company }: { company: WorkspaceCompany }) {
  return (
    <Link
      href={company.nextHref}
      className="flex min-h-[200px] flex-col rounded-[14px] border border-transparent bg-card px-[18px] pt-[18px] pb-4 hover:border-line hover:bg-[#13161A]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#191C21] text-[14.5px] font-semibold text-muted">
          {company.initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-[#ECECE8]">{company.name}</div>
          <div className="mt-0.5 text-xs text-faint">
            <span className="font-semibold tracking-[0.02em]">{company.symbol}</span>
            {company.sector ? ` · ${company.sector}` : ""}
          </div>
        </div>
      </div>
      <div className="mt-[18px]">
        <Segments stageFilled={company.stageFilled} />
      </div>
      <div className="mt-3 text-[13.5px] font-semibold text-[#DCDDD8]">{company.stageLabel}</div>
      <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
        {company.hasThesis ? "Thesis written" : "Thesis not started"}
      </div>
      <div className="mt-auto flex items-center gap-2.5 pt-4">
        <span className="text-xs text-faint">
          {company.lastActivity ? `Viewed ${formatRelativeTime(company.lastActivity)}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-link">
          {company.hasThesis ? "Open thesis" : "Continue research"}
          <ArrowRight size={12} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}

function WatchlistTable({ workspace }: { workspace: ReturnType<typeof useResearchWorkspace> }) {
  const [pending, setPending] = useState<string | null>(null);

  if (workspace.watchlist.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-7 text-[13.5px] text-muted">
        Your watchlist is empty. Add companies you look up with the star, or from the search above.
      </p>
    );
  }

  async function remove(symbol: string) {
    setPending(symbol);
    try {
      await workspace.toggleWatchlist(symbol);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] flex-col">
        <div className="grid grid-cols-[2fr_1.2fr_1.6fr_1fr_190px] gap-4 border-b border-line px-3 pb-2.5 text-xs text-faint">
          <span>Company</span>
          <span>Sector</span>
          <span>Research progress</span>
          <span>Last activity</span>
          <span />
        </div>
        {workspace.watchlist.map((company) => (
          <div
            key={company.symbol}
            className="grid grid-cols-[2fr_1.2fr_1.6fr_1fr_190px] items-center gap-4 border-b border-[#131518] px-3 py-3 hover:bg-card"
          >
            <Link href={instrumentPath(company.symbol)} className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#191C21] text-[13px] font-semibold text-muted">
                {company.initial}
              </div>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-sm font-medium text-[#ECECE8]">{company.name}</span>
                <span className="text-xs font-semibold tracking-[0.02em] text-faint">{company.symbol}</span>
              </span>
            </Link>
            <span className="text-[13.5px] text-muted">{company.sector ?? "—"}</span>
            <span className="flex items-center gap-2.5">
              <span className="w-16">
                <Segments stageFilled={company.stageFilled} height={10} />
              </span>
              <span className="text-[13px] text-[#BDC3CB]">{company.stageLabel}</span>
            </span>
            <span className="text-[13px] text-faint">
              {company.lastActivity ? formatRelativeTime(company.lastActivity) : "—"}
            </span>
            <span className="flex items-center justify-end gap-1">
              <Link
                href={company.nextHref}
                className="flex h-[30px] items-center rounded-[8px] px-[11px] text-[13px] font-semibold text-link hover:bg-[#16191D] hover:text-link-hover"
              >
                {company.hasThesis ? "Open thesis" : "Continue"}
              </Link>
              <button
                type="button"
                onClick={() => remove(company.symbol)}
                disabled={pending === company.symbol}
                title="Remove from watchlist"
                aria-label="Remove from watchlist"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-faint hover:bg-[#16191D] hover:text-[#ECECE8] disabled:opacity-50"
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscoverTile({
  company,
  onToggle,
}: {
  company: WorkspaceCompany;
  onToggle: (symbol: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    try {
      await onToggle(company.symbol);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link
      href={instrumentResearchPath(company.symbol)}
      className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 hover:bg-card"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#16191D] text-[13px] font-semibold text-dim">
        {company.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-[#DCDDD8]">{company.name}</div>
        <div className="mt-0.5 truncate text-xs text-faint">
          <span className="font-semibold">{company.symbol}</span>
          {company.sector ? ` · ${company.sector}` : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        title="Add to watchlist"
        aria-label="Add to watchlist"
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-faint hover:bg-[#16191D] disabled:opacity-50"
      >
        <Star size={14} strokeWidth={1.8} />
      </button>
    </Link>
  );
}
