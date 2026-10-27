"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Search, Trash2 } from "lucide-react";
import { apiBlob } from "@/lib/auth";
import { instrumentThesisPath } from "@/lib/instruments";
import { deleteThesis, listTheses, type Thesis } from "@/lib/theses";

type Status = "draft" | "active";
type Filter = "all" | "active" | "draft";

type Card = {
  id: number;
  symbol: string | null;
  company: string;
  ticker: string;
  title: string;
  summary: string;
  status: Status;
  updated: string;
  updatedAt: number;
  progress: { label: string; done: boolean }[] | null;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
];

const RESEARCH_STEPS = [
  { label: "Business", area: "business" },
  { label: "Financials", area: "profit" },
  { label: "Valuation", area: "valuation" },
  { label: "Risks", area: "risks" },
];

export function ThesesView() {
  const router = useRouter();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listTheses();
        if (!cancelled) {
          setTheses(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load theses.");
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

  const cards = useMemo(() => theses.map(toCard), [theses]);
  const activeCount = cards.filter((card) => card.status === "active").length;
  const draftCount = cards.filter((card) => card.status === "draft").length;
  const needle = query.trim().toLowerCase();
  const visible = cards
    .filter((card) => (filter === "all" ? true : card.status === filter))
    .filter((card) => !needle || `${card.company} ${card.ticker} ${card.title} ${card.summary}`.toLowerCase().includes(needle))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const groups =
    filter === "all"
      ? [
          { title: "In progress", sub: "pick up where you stopped", items: visible.filter((card) => card.status === "draft") },
          { title: "Active", sub: "saved and ready to revisit", items: visible.filter((card) => card.status === "active") },
        ].filter((group) => group.items.length > 0)
      : [{ title: "", sub: "", items: visible }];

  async function onDelete(id: number) {
    try {
      await deleteThesis(id);
      setTheses((current) => current.filter((thesis) => thesis.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete thesis.");
    }
  }

  function focusSearch() {
    document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
  }

  return (
    <div className="flex w-full max-w-[1040px] flex-col gap-7 px-4 pt-5 pb-16 sm:px-10">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0 flex-[1_1_320px]">
          <h1 className="text-[30px] font-normal tracking-[-0.02em] text-[#ECECE8]">Thesis</h1>
          <p className="mt-2 text-[14.5px] text-[#8A9199]">Build, track and challenge your investment convictions.</p>
        </div>
        <button
          type="button"
          onClick={focusSearch}
          className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#8E9CE0] px-[18px] text-sm font-semibold text-[#0A0B0C] hover:bg-[#AAB5EA]"
        >
          <span className="text-[17px] leading-none font-medium">+</span>
          New thesis
        </button>
      </div>

      {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}

      {loading ? (
        <div className="min-h-[40vh]" />
      ) : cards.length === 0 ? (
        <section className="flex flex-col items-center rounded-[18px] bg-card px-8 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#171A1F] text-[#8E9CE0]">
            <FileText size={20} strokeWidth={1.7} />
          </div>
          <h2 className="mt-[22px] text-[22px] font-normal tracking-[-0.015em] text-[#ECECE8]">Build your first investment thesis</h2>
          <p className="mt-2.5 max-w-[460px] text-[14.5px] leading-relaxed text-[#8A9199]">
            Research a company, organise the evidence, and write why the investment may or may not be attractive.
          </p>
          <button
            type="button"
            onClick={focusSearch}
            className="mt-[26px] inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#16191D] px-[18px] text-sm font-semibold text-[#ECECE8] hover:bg-[#1C2027]"
          >
            Research a company
            <ArrowRight size={14} strokeWidth={2.1} />
          </button>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5 text-[12.5px] text-[#5E646D]">
            <span>Research</span>
            <span className="text-[#3A4048]">→</span>
            <span>Thesis</span>
            <span className="text-[#3A4048]">→</span>
            <span>Review over time</span>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-7">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2.5 border-y border-[#16191D] py-3.5">
            <CountButton label="Active" count={activeCount} onClick={() => setFilter("active")} />
            <CountButton label="Drafts" count={draftCount} onClick={() => setFilter("draft")} />
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex flex-wrap gap-0.5 rounded-[10px] bg-[#0E1013] p-[3px]">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`h-[30px] rounded-lg px-3 text-[13px] whitespace-nowrap ${filter === item.id ? "bg-[#1B1F25] font-semibold text-[#ECECE8]" : "font-medium text-[#7C828B] hover:text-[#ECECE8]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="ml-auto flex h-9 min-w-[200px] flex-[0_1_260px] items-center gap-2 rounded-[9px] bg-[#0E1013] px-3">
              <Search size={13} className="text-[#5E646D]" strokeWidth={1.9} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search thesis or company…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#ECECE8] outline-none placeholder:text-[#5E646D]"
              />
            </label>
          </div>

          {groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#7C828B]">
              {needle ? `No thesis matches “${query.trim()}”.` : "Nothing here yet."}
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map((group) => (
                <div key={group.title || "results"} className="flex flex-col gap-2.5">
                  {group.title ? (
                    <div className="flex items-baseline gap-2.5 px-1 pb-1">
                      <span className="text-[13px] font-semibold text-[#BDC3CB]">{group.title}</span>
                      <span className="text-xs text-[#5E646D]">{group.sub}</span>
                    </div>
                  ) : null}
                  {group.items.map((card) => (
                    <ThesisCard key={card.id} card={card} onOpen={() => card.symbol && router.push(instrumentThesisPath(card.symbol))} onDelete={() => onDelete(card.id)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[12.5px] text-[#5E646D]">Quantora keeps your reasoning organised. Conclusions and decisions remain yours.</p>
    </div>
  );
}

function CountButton({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-baseline gap-2.5">
      <span className="text-[22px] font-light tracking-[-0.01em] text-[#ECECE8]">{count}</span>
      <span className="text-[13px] text-[#8A9199]">{label}</span>
    </button>
  );
}

function ThesisCard({ card, onOpen, onDelete }: { card: Card; onOpen: () => void; onDelete: () => void }) {
  const draft = card.status === "draft";
  return (
    <article className="rounded-[14px] bg-card px-[22px] py-5">
      <div className="flex items-start gap-4">
        <Mark symbol={card.symbol} letter={card.company[0] ?? card.ticker[0] ?? "?"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[13.5px] font-semibold text-[#BDC3CB]">{card.company}</span>
            {card.ticker ? <span className="text-xs font-semibold tracking-[0.02em] text-[#6C727B]">{card.ticker}</span> : null}
            <span className="ml-auto flex items-center gap-3">
              <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[11.5px] font-semibold ${draft ? "bg-[#16191D] text-[#BDC3CB]" : "bg-[rgba(91,106,203,0.12)] text-[#AAB5EA]"}`}>
                <span className={`h-[5px] w-[5px] rounded-full ${draft ? "bg-[#7C828B]" : "bg-[#8E9CE0]"}`} />
                {draft ? "Draft" : "Active"}
              </span>
              <span className="text-xs whitespace-nowrap text-[#6C727B]">{card.updated}</span>
            </span>
          </div>
          <button type="button" onClick={onOpen} disabled={!card.symbol} className="mt-2 block text-left text-lg font-medium tracking-[-0.01em] text-[#ECECE8] hover:text-link disabled:hover:text-[#ECECE8]">
            {card.title}
          </button>
          {card.summary && card.summary !== card.title ? (
            <p className="mt-1.5 line-clamp-2 max-w-[640px] text-sm leading-relaxed text-[#9BA1A9]">{card.summary}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {card.progress ? (
              <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px]">
                <span className="text-[#6C727B]">Research</span>
                {card.progress.map((step) => (
                  <span key={step.label} className={step.done ? "text-[#9BA1A9]" : "text-[#5E646D]"}>
                    {step.label} <span className={step.done ? "text-[#8E9CE0]" : "text-[#484D55]"}>{step.done ? "✓" : "—"}</span>
                  </span>
                ))}
              </span>
            ) : null}
            <span className="ml-auto flex items-center gap-2">
              <button type="button" onClick={onDelete} aria-label="Delete thesis" className="rounded-lg p-1.5 text-[#5E646D] hover:bg-[#1A1D22] hover:text-[#BDC3CB]">
                <Trash2 size={14} strokeWidth={1.7} />
              </button>
              <button type="button" onClick={onOpen} disabled={!card.symbol} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#AAB5EA] hover:text-link disabled:opacity-40">
                {draft ? "Continue thesis" : "Open thesis"}
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Mark({ symbol, letter }: { symbol: string | null; letter: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!symbol) {
      return;
    }
    let active = true;
    let objectUrl: string | null = null;
    apiBlob(`/api/instruments/${encodeURIComponent(symbol)}/logo`).then((blob) => {
      if (!active || !blob) {
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [symbol]);
  if (src) {
    return <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-[11px] bg-[#191C21] object-contain p-1" />;
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#191C21] text-[15px] font-semibold text-[#BDC3CB]">
      {letter.toUpperCase()}
    </div>
  );
}

function toCard(thesis: Thesis): Card {
  const status = statusOf(thesis);
  const company = thesis.title.replace(/\s+thesis$/i, "").trim() || thesis.symbol || "Thesis";
  const headline = firstSentence(thesis.thesisBody) || thesis.title;
  const when = thesis.updatedAt ?? thesis.createdAt;
  return {
    id: thesis.id,
    symbol: thesis.symbol,
    company,
    ticker: thesis.symbol ?? "",
    title: headline,
    summary: thesis.thesisBody,
    status,
    updated: formatUpdated(when),
    updatedAt: when ? new Date(when).getTime() : 0,
    progress: thesis.symbol ? researchProgress(thesis.symbol) : null,
  };
}

function statusOf(thesis: Thesis): Status {
  try {
    const parsed = thesis.points ? (JSON.parse(thesis.points) as { status?: string }) : null;
    return parsed?.status === "draft" ? "draft" : "active";
  } catch {
    return "active";
  }
}

function researchProgress(symbol: string) {
  let reviewed: string[] = [];
  try {
    const raw = window.localStorage.getItem(`quantora.research.${symbol}`);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    reviewed = Array.isArray(parsed) ? parsed : [];
  } catch {
    reviewed = [];
  }
  if (reviewed.length === 0) {
    return null;
  }
  return RESEARCH_STEPS.map((step) => ({ label: step.label, done: reviewed.includes(step.area) }));
}

function firstSentence(text: string) {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  const sentence = end > 0 ? trimmed.slice(0, end + 1) : trimmed;
  return sentence.length > 110 ? `${sentence.slice(0, 107).trimEnd()}…` : sentence;
}

function formatUpdated(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}
