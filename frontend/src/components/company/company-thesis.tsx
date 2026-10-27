"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { CompanyIdentity } from "@/components/company/company-identity";
import {
  formatCompactMoney,
  formatPrice,
  getCompanyStatements,
  getInstrument,
  instrumentFinancialsPath,
  instrumentPath,
  instrumentResearchPath,
  type CompanyProfile,
  type StatementLine,
} from "@/lib/instruments";
import {
  createThesis,
  createThesisReview,
  listTheses,
  listThesisReviews,
  updateThesis,
  type ReviewVerdict,
  type Thesis,
  type ThesisReview,
} from "@/lib/theses";

type Point = { id: string; text: string; source?: string };
type Status = "new" | "draft" | "saved";
type Insight = { id: string; text: string; area: string; target: "why" | "risks" };
type ValuationSnapshot = { price: string | null; pe: string | null; forwardPe: string | null; priceToFcf: string | null; date: string };

const EMPTY = (): Point => ({ id: uid(), text: "" });

export function CompanyThesis({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [thesisId, setThesisId] = useState<number | null>(null);
  const [view, setView] = useState("");
  const [why, setWhy] = useState<Point[]>([EMPTY()]);
  const [drivers, setDrivers] = useState<Point[]>([]);
  const [risks, setRisks] = useState<Point[]>([EMPTY()]);
  const [conds, setConds] = useState<Point[]>([EMPTY()]);
  const [status, setStatus] = useState<Status>("new");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ValuationSnapshot | null>(null);
  const [reviews, setReviews] = useState<ThesisReview[]>([]);
  const [reviewVerdict, setReviewVerdict] = useState<ReviewVerdict>("STILL_VALID");
  const [reviewNote, setReviewNote] = useState("");
  const [addingReview, setAddingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const profile = await getInstrument(symbol);
        if (controller.signal.aborted) {
          return;
        }
        if (profile.symbol && profile.symbol.toUpperCase() !== symbol.trim().toUpperCase()) {
          router.replace(`${instrumentPath(profile.symbol)}/thesis`);
          return;
        }
        setCompany(profile);
        const [theses, statements] = await Promise.all([
          listTheses(),
          getCompanyStatements(profile.symbol, "ANNUAL").catch(() => null),
        ]);
        if (controller.signal.aborted) {
          return;
        }
        if (statements) {
          setLines(statements.lines);
        }
        const existing = theses.find((item) => item.symbol?.toUpperCase() === profile.symbol.toUpperCase());
        if (existing) {
          hydrate(existing, setView, setWhy, setDrivers, setRisks, setConds, setStatus, setSavedAt, setCreatedAt, setSnapshot);
          setThesisId(existing.id);
          setEditing(false);
          try {
            const items = await listThesisReviews(existing.id);
            if (!controller.signal.aborted) {
              setReviews(items);
            }
          } catch {
            // Review history is secondary to the thesis itself; fail silently.
          }
        } else {
          const draft = readDraft(profile.symbol);
          if (draft) {
            setView(draft.view);
            setWhy(draft.why.length ? draft.why : [EMPTY()]);
            setDrivers(draft.drivers);
            setRisks(draft.risks.length ? draft.risks : [EMPTY()]);
            setConds(draft.conds.length ? draft.conds : [EMPTY()]);
            setStatus("draft");
            setDirty(true);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load this company.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [symbol, router]);

  const displayName = company ? company.name.replace(/\s+Inc\.?$/i, "").trim() || company.name : "";
  const currency = company?.currency ?? "USD";
  const insights = useMemo(() => (company ? buildInsights(lines, currency) : []), [company, lines, currency]);
  const done = [
    view.trim().length > 0,
    filled(why),
    filled(drivers),
    filled(risks),
    filled(conds),
  ];
  const doneCount = done.filter(Boolean).length;
  const missing = done
    .map((ready, index) => (ready ? null : ["My view", "Why this company", "Growth drivers", "Risks", "What would change my mind"][index]))
    .filter((item): item is string => item != null);

  function edit(apply: () => void) {
    apply();
    setDirty(true);
    setNote(null);
  }

  useEffect(() => {
    if (!company || loading || thesisId) {
      return;
    }
    writeDraft(company.symbol, { view, why, drivers, risks, conds });
  }, [company, loading, thesisId, view, why, drivers, risks, conds]);

  async function persist(nextStatus: "draft" | "saved") {
    if (!company) {
      return;
    }
    if (!view.trim()) {
      setNote("Write your view before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    const frozen = snapshot ?? captureSnapshot(company, lines);
    const input = {
      title: `${displayName} thesis`.slice(0, 120),
      symbol: company.symbol,
      thesisBody: view.trim(),
      invalidation: conds.map((point) => point.text.trim()).filter(Boolean).join("\n") || undefined,
      points: JSON.stringify({
        status: nextStatus,
        why: kept(why),
        drivers: kept(drivers),
        risks: kept(risks),
        snapshot: nextStatus === "saved" ? frozen : snapshot,
      }),
    };
    try {
      const saved = thesisId ? await updateThesis(thesisId, input) : await createThesis(input);
      setThesisId(saved.id);
      setStatus(nextStatus);
      setDirty(false);
      setEditing(nextStatus !== "saved");
      if (nextStatus === "saved") {
        setSnapshot(frozen);
      }
      setCreatedAt((current) => current ?? formatWhen(saved.createdAt));
      setSavedAt(formatWhen(saved.updatedAt ?? saved.createdAt));
      setNote(null);
      clearDraft(company.symbol);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this thesis.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReview() {
    if (!thesisId) {
      return;
    }
    setAddingReview(true);
    setReviewError(null);
    try {
      const created = await createThesisReview(thesisId, {
        verdict: reviewVerdict,
        note: reviewNote.trim() || undefined,
      });
      setReviews((current) => [created, ...current]);
      setReviewNote("");
      setReviewVerdict("STILL_VALID");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not save this review.");
    } finally {
      setAddingReview(false);
    }
  }

  function addInsight(insight: Insight) {
    const target = insight.target === "why" ? setWhy : setRisks;
    target((current) => {
      if (current.some((point) => point.source === insight.id)) {
        return current;
      }
      return [...current.filter((point) => point.text.trim()), { id: uid(), text: insight.text, source: insight.id }];
    });
    setDirty(true);
  }

  if (loading) {
    return <div className="min-h-[50vh]" />;
  }
  if (error && !company) {
    return (
      <div className="px-4 py-10 sm:px-10 sm:py-14">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Company not found</h1>
        <p className="mt-3 max-w-[46ch] text-[15px] text-muted">{error}</p>
      </div>
    );
  }
  if (!company) {
    return null;
  }

  const savedClean = status === "saved" && !dirty;
  const reading = savedClean && !editing;
  const statusLabel = savedClean ? "Saved" : status === "draft" && !dirty ? "Draft" : thesisId && dirty ? "Edited" : "Not saved";
  const attached = [...why, ...drivers, ...risks].filter((point) => point.source && point.text.trim());
  const watching = watchingNow(company, lines, currency);
  const shownSnapshot = snapshot ?? captureSnapshot(company, lines);

  return (
    <div className="flex w-full max-w-[1240px] flex-col gap-7 px-4 pb-14 pt-3 sm:px-10">
      <CompanyIdentity company={company} tab="thesis" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-[1_1_420px]">
          {reading ? (
            <SavedThesis
              view={view}
              why={kept(why)}
              drivers={kept(drivers)}
              risks={kept(risks)}
              conditions={kept(conds)}
              createdAt={createdAt}
              snapshot={shownSnapshot}
              snapshotFrozen={snapshot != null}
              watching={watching}
              insights={insights}
              onEdit={() => setEditing(true)}
              reviews={reviews}
              reviewVerdict={reviewVerdict}
              onVerdictChange={setReviewVerdict}
              reviewNote={reviewNote}
              onNoteChange={setReviewNote}
              addingReview={addingReview}
              reviewError={reviewError}
              onSubmitReview={submitReview}
            />
          ) : (
          <>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4 pb-6">
            <div className="min-w-0 flex-[1_1_320px]">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[28px] font-normal tracking-[-0.02em] text-[#ECECE8]">Your thesis</h2>
                <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${savedClean ? "bg-[rgba(91,106,203,0.14)] text-[#AAB5EA]" : "bg-[#16191D] text-[#7C828B]"}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 max-w-[540px] text-[14.5px] leading-relaxed text-[#8A9199]">
                Define what you believe about {displayName}, why you believe it, and what would prove you wrong.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[12.5px] text-[#7C828B]">
                Thesis progress · <span className="font-semibold text-[#BDC3CB]">{doneCount} / 5</span>
              </span>
              <div className="flex gap-1">
                {done.map((ready, index) => (
                  <span key={index} className={`h-[3px] w-[22px] rounded-sm ${ready ? "bg-[#8E9CE0]" : "bg-[#1E2228]"}`} />
                ))}
              </div>
            </div>
          </div>

          <Section index="01" kicker="My view" title={`What is your overall view of ${displayName}?`} hint="Summarize your investment idea in a few sentences.">
            <textarea
              value={view}
              onChange={(event) => edit(() => setView(event.target.value))}
              placeholder={`${displayName} is interesting because…`}
              maxLength={4000}
              className="mt-4 block min-h-[132px] w-full resize-y rounded-xl border border-[#16191D] bg-card px-[18px] py-4 text-[15.5px] leading-relaxed text-[#ECECE8] outline-none placeholder:text-[#5E646D] focus:border-[#2A3040] focus:bg-[#121418]"
            />
            <p className="mt-2 text-xs text-[#5E646D]">This is the summary shown on your theses list.</p>
          </Section>

          <Section index="02" kicker="Why this company?" title="What makes this company interesting to you?">
            <PointList
              points={why}
              placeholder="Describe a reason in one line"
              onChange={(id, text) => edit(() => setWhy((current) => current.map((point) => (point.id === id ? { ...point, text } : point))))}
              onRemove={(id) => edit(() => setWhy((current) => current.filter((point) => point.id !== id)))}
            />
            <AddButton label="Add point" onClick={() => edit(() => setWhy((current) => [...current, EMPTY()]))} />
          </Section>

          <Section index="03" kicker="Growth drivers" title="What could drive the company forward?">
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
              {drivers.map((point) => (
                <div key={point.id} className="flex min-h-16 items-start gap-2.5 rounded-[10px] bg-card px-3.5 py-3">
                  <ArrowUpRight size={12} className="mt-1 shrink-0 text-[#8E9CE0]" strokeWidth={2.2} />
                  <textarea
                    rows={2}
                    value={point.text}
                    placeholder="A growth driver"
                    onChange={(event) => edit(() => setDrivers((current) => current.map((item) => (item.id === point.id ? { ...item, text: event.target.value } : item))))}
                    className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-snug text-[#DCDDD8] outline-none placeholder:text-[#5E646D]"
                  />
                  <RemoveButton onClick={() => edit(() => setDrivers((current) => current.filter((item) => item.id !== point.id)))} />
                </div>
              ))}
              <button
                type="button"
                onClick={() => edit(() => setDrivers((current) => [...current, EMPTY()]))}
                className="flex min-h-16 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#1E2228] text-[13px] font-medium text-[#7C828B] hover:border-[#2A3040] hover:text-[#ECECE8]"
              >
                + Add growth driver
              </button>
            </div>
          </Section>

          <Section index="04" kicker="Risks" title="What could challenge your thesis?">
            <PointList
              points={risks}
              tone="risk"
              placeholder="Describe a risk in one line"
              onChange={(id, text) => edit(() => setRisks((current) => current.map((point) => (point.id === id ? { ...point, text } : point))))}
              onRemove={(id) => edit(() => setRisks((current) => current.filter((point) => point.id !== id)))}
            />
            <AddButton label="Add risk" onClick={() => edit(() => setRisks((current) => [...current, EMPTY()]))} />
          </Section>

          <section className="mt-1 rounded-2xl border border-[#1E2330] bg-card px-6 py-[22px]">
            <div className="flex gap-3.5">
              <span className="w-5 shrink-0 text-xs font-semibold text-[#8E9CE0]">05</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8E9CE0] uppercase">What would change my mind?</span>
                  <span className="text-[11.5px] text-[#6C727B]">the most important part of a thesis</span>
                </div>
                <h3 className="mt-2 text-[19px] font-medium tracking-[-0.01em] text-[#ECECE8]">What would make your thesis no longer valid?</h3>
                <p className="mt-1 text-[13.5px] text-[#8A9199]">Name a signal you could actually check later.</p>
                <div className="mt-[18px] flex flex-col gap-2">
                  {conds.map((point) => (
                    <div key={point.id} className="flex items-start gap-3 rounded-[10px] bg-[#0E1013] px-4 py-3">
                      <span className="mt-0.5 text-xs font-semibold text-[#8E9CE0]">If</span>
                      <textarea
                        rows={2}
                        value={point.text}
                        placeholder="A sustained slowdown you would not explain away."
                        onChange={(event) => edit(() => setConds((current) => current.map((item) => (item.id === point.id ? { ...item, text: event.target.value } : item))))}
                        className="min-w-0 flex-1 resize-none bg-transparent text-[14.5px] leading-relaxed text-[#ECECE8] outline-none placeholder:text-[#5E646D]"
                      />
                      <RemoveButton onClick={() => edit(() => setConds((current) => current.filter((item) => item.id !== point.id)))} />
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={() => edit(() => setConds((current) => [...current, EMPTY()]))} className="h-[30px] rounded-lg px-2.5 text-[13px] font-medium text-[#AAB5EA] hover:bg-[#16191D] hover:text-[#ECECE8]">
                    + Add condition
                  </button>
                  <span className="text-xs text-[#6C727B]">Specific signals are easier to revisit than a feeling.</span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-9 flex flex-col gap-4 border-t border-[#16191D] pt-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={saving || savedClean}
                onClick={() => persist("saved")}
                className="inline-flex h-11 items-center rounded-[10px] bg-[#8E9CE0] px-5 text-sm font-semibold text-[#0A0B0C] hover:bg-[#AAB5EA] disabled:opacity-60"
              >
                {saving ? "Saving…" : savedClean ? "Saved" : "Save thesis"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => persist("draft")}
                className="h-11 rounded-[10px] border border-[#1E2228] px-[18px] text-sm font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-[#ECECE8] disabled:opacity-60"
              >
                Save as draft
              </button>
              <span className="text-[12.5px] text-[#7C828B]">
                {error
                  ? error
                  : note
                    ? note
                    : savedClean && savedAt
                      ? `Saved · ${savedAt}`
                      : status === "draft" && !dirty && savedAt
                        ? `Draft saved · ${savedAt}`
                        : missing.length
                          ? `Still open: ${missing.join(", ")}`
                          : "Ready to save"}
              </span>
            </div>
            <p className="max-w-[560px] text-[13px] leading-relaxed text-[#6C727B]">
              You can come back and change this as the company changes. Quantora keeps the latest version of your reasoning.
            </p>
          </div>
          </>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3.5 lg:w-[280px] lg:shrink-0">
          {reading ? (
            <EvidencePanel points={attached} insights={insights} symbol={company.symbol} />
          ) : (
          <div className="rounded-[14px] bg-card px-[18px] pt-[18px] pb-2">
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="text-[13.5px] font-semibold text-[#ECECE8]">From the filings</span>
              <Link href={instrumentResearchPath(company.symbol)} className="text-xs text-[#7C828B] hover:text-[#AAB5EA]">
                Open
              </Link>
            </div>
            <p className="mt-1 text-xs text-[#6C727B]">Add a figure to your thesis</p>
            {insights.length === 0 ? (
              <p className="mt-3 border-t border-[#16191D] py-3 text-[13px] leading-relaxed text-[#8A9199]">
                Research {displayName} first. Insights appear once the filings are loaded.
              </p>
            ) : (
              <div className="mt-2.5">
                {insights.map((insight) => {
                  const added = [...why, ...risks].some((point) => point.source === insight.id);
                  return (
                    <div key={insight.id} className="border-t border-[#16191D] py-3">
                      <p className="text-[13.5px] leading-snug text-[#C9CBC6]">{insight.text}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11.5px] text-[#5E646D]">{insight.area}</span>
                        <button
                          type="button"
                          onClick={() => addInsight(insight)}
                          className={`h-[26px] rounded-[7px] px-2 text-xs font-medium ${added ? "bg-[rgba(91,106,203,0.12)] text-[#AAB5EA]" : "bg-[#16191D] text-[#9BA1A9] hover:text-[#ECECE8]"}`}
                        >
                          {added ? "Added" : "Add to thesis"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
          <p className="px-1.5 text-xs leading-relaxed text-[#5E646D]">Quantora organises your reasoning. It doesn’t rate the company or recommend a decision.</p>
        </aside>
      </div>
    </div>
  );
}

function SavedThesis({
  view,
  why,
  drivers,
  risks,
  conditions,
  createdAt,
  snapshot,
  snapshotFrozen,
  watching,
  insights,
  onEdit,
  reviews,
  reviewVerdict,
  onVerdictChange,
  reviewNote,
  onNoteChange,
  addingReview,
  reviewError,
  onSubmitReview,
}: {
  view: string;
  why: Point[];
  drivers: Point[];
  risks: Point[];
  conditions: Point[];
  createdAt: string | null;
  snapshot: ValuationSnapshot;
  snapshotFrozen: boolean;
  watching: { label: string; value: string }[];
  insights: Insight[];
  onEdit: () => void;
  reviews: ThesisReview[];
  reviewVerdict: ReviewVerdict;
  onVerdictChange: (verdict: ReviewVerdict) => void;
  reviewNote: string;
  onNoteChange: (note: string) => void;
  addingReview: boolean;
  reviewError: string | null;
  onSubmitReview: () => void;
}) {
  const lastReviewed = reviews.length > 0 ? formatWhen(reviews[0].createdAt) : null;
  const figures = snapshot
    ? [
        ["Price", snapshot.price],
        ["P/E", snapshot.pe],
        ["Forward P/E", snapshot.forwardPe],
        ["Price / FCF", snapshot.priceToFcf],
        ["Date", snapshot.date],
      ].filter((item): item is [string, string] => Boolean(item[1]))
    : [];
  return (
    <>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 pb-6">
        <div className="min-w-0 flex-[1_1_320px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[28px] font-normal tracking-[-0.02em] text-[#ECECE8]">Your thesis</h2>
            <span className="rounded-md bg-[rgba(91,106,203,0.14)] px-2 py-0.5 text-[11.5px] font-semibold text-[#AAB5EA]">Active</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-[#7C828B]">
            <span>Created {createdAt ?? "—"}</span>
            <span className="text-[#484D55]">·</span>
            <span>Last reviewed {lastReviewed ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="#thesis-review" className="inline-flex h-9 items-center rounded-[9px] bg-[rgba(91,106,203,0.16)] px-4 text-[13.5px] font-semibold text-[#C3CBF0] hover:bg-[rgba(91,106,203,0.24)] hover:text-[#ECECE8]">
            Review thesis
          </a>
          <button type="button" onClick={onEdit} className="h-9 rounded-[9px] border border-[#1E2228] px-4 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-[#ECECE8]">
            Edit
          </button>
        </div>
      </div>

      <section className="border-t border-[#16191D] py-8">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-[#6C727B] uppercase">My view</h3>
        <p className="mt-3.5 max-w-[680px] text-[19px] leading-relaxed tracking-[-0.005em] text-[#ECECE8]">{view}</p>
      </section>

      {why.length > 0 ? (
        <section className="border-t border-[#16191D] py-7">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Why I believe this</h3>
          <div className="mt-3.5 flex flex-col">
            {why.map((point) => (
              <div key={point.id} className="flex items-baseline gap-3.5 py-2.5">
                <span className="h-[5px] w-[5px] shrink-0 translate-y-[-3px] rounded-full bg-[#8A9199]" />
                <span className="min-w-0 flex-1 text-[15px] leading-relaxed text-[#DCDDD8]">{point.text}</span>
                {point.source ? <SourceMark label={insights.find((item) => item.id === point.source)?.area ?? "Filings"} /> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {drivers.length > 0 ? (
        <section className="border-t border-[#16191D] py-7">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Key assumptions</h3>
          <p className="mt-1 text-[13.5px] text-[#8A9199]">What must remain true for this thesis to hold.</p>
          <div className="mt-4 flex flex-col gap-4">
            {drivers.map((point, index) => (
              <div key={point.id} className="flex gap-3.5">
                <span className="w-5 shrink-0 text-xs font-semibold text-[#5E646D]">A{index + 1}</span>
                <p className="text-[15px] font-semibold text-[#ECECE8]">{point.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {risks.length > 0 ? (
        <section className="border-t border-[#16191D] py-7">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Risks</h3>
          <div className="mt-3 flex flex-col">
            {risks.map((point) => (
              <div key={point.id} className="flex items-baseline gap-3.5 py-2.5">
                <span className="h-0.5 w-2 shrink-0 translate-y-[-3px] rounded-sm bg-[#B89A74]" />
                <span className="text-[15px] leading-relaxed text-[#DCDDD8]">{point.text}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {conditions.length > 0 ? (
        <section className="mt-1 rounded-2xl border border-[#1E2330] bg-card px-6 py-[22px]">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">What could prove me wrong</h3>
          <p className="mt-1 text-[13.5px] text-[#8A9199]">Signals that would make me reconsider the thesis.</p>
          <div className="mt-4 flex flex-col">
            {conditions.map((point) => (
              <div key={point.id} className="flex items-baseline gap-3.5 border-t border-[#181C22] py-2.5">
                <span className="text-xs font-semibold text-[#8E9CE0]">If</span>
                <span className="text-[14.5px] leading-relaxed text-[#DCDDD8]">{point.text}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {watching.length > 0 ? (
        <section className="mt-8 border-t border-[#16191D] py-7">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">What I’m watching</h3>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
            {watching.map((item) => (
              <div key={item.label} className="rounded-[10px] bg-card px-4 py-3">
                <div className="text-[12.5px] text-[#8A9199]">{item.label}</div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[11.5px] text-[#5E646D]">Latest</span>
                  <span className="text-base font-semibold text-[#ECECE8]">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {figures.length > 0 ? (
        <section className="border-t border-[#16191D] py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">{snapshotFrozen ? "Valuation at thesis creation" : "Valuation"}</h3>
            <span className="text-xs text-[#6C727B]">{snapshotFrozen ? "Snapshot · not updated" : "Latest"}</span>
          </div>
          <div className="mt-4 flex flex-wrap">
            {figures.map(([label, value], index) => (
              <div key={label} className={`pr-7 ${index < figures.length - 1 ? "mr-7 border-r border-[#16191D]" : ""}`}>
                <div className="text-xs text-[#7C828B]">{label}</div>
                <div className="mt-1 text-[15px] font-semibold text-[#DCDDD8]">{value}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="thesis-review" className="scroll-mt-6 border-t border-[#16191D] py-7">
        <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">Review history</h3>
        <div className="mt-4 flex items-baseline gap-3.5">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#8E9CE0]" />
          <span className="w-24 shrink-0 text-[13px] text-[#7C828B]">{createdAt ?? "—"}</span>
          <span className="text-sm text-[#DCDDD8]">Thesis created</span>
        </div>
        {[...reviews].reverse().map((review) => (
          <div key={review.id} className="mt-4 flex items-baseline gap-3.5">
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${verdictDot(review.verdict)}`} />
            <span className="w-24 shrink-0 text-[13px] text-[#7C828B]">{formatWhen(review.createdAt) ?? "—"}</span>
            <div className="min-w-0 flex-1">
              <span className="text-sm text-[#DCDDD8]">{verdictLabel(review.verdict)}</span>
              {review.note ? <p className="mt-1 text-[13.5px] leading-relaxed text-[#8A9199]">{review.note}</p> : null}
            </div>
          </div>
        ))}
        <div className="mt-[18px] flex flex-col gap-3 rounded-xl bg-card px-5 py-[18px]">
          {reviews.length === 0 ? (
            <p className="text-[13.5px] leading-relaxed text-[#8A9199]">Review your thesis over time to check whether your original assumptions still hold.</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5">
            {VERDICT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onVerdictChange(option.value)}
                className={`h-8 rounded-[8px] px-3 text-[13px] font-medium ${reviewVerdict === option.value ? "bg-[#8E9CE0] text-[#0A0B0C]" : "bg-[#16191D] text-[#9BA1A9] hover:text-[#ECECE8]"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={reviewNote}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="What did you check? Anything that changed?"
            maxLength={2000}
            className="min-w-0 resize-none rounded-[10px] bg-[#0E1013] px-4 py-3 text-[14px] leading-relaxed text-[#ECECE8] outline-none placeholder:text-[#5E646D]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={addingReview}
              onClick={onSubmitReview}
              className="inline-flex h-9 items-center rounded-[9px] bg-[rgba(91,106,203,0.16)] px-4 text-[13.5px] font-semibold text-[#C3CBF0] hover:bg-[rgba(91,106,203,0.24)] hover:text-[#ECECE8] disabled:opacity-60"
            >
              {addingReview ? "Saving…" : "Log this review"}
            </button>
            {reviewError ? <span className="text-[12.5px] text-[#B88A74]">{reviewError}</span> : null}
          </div>
        </div>
      </section>
    </>
  );
}

function EvidencePanel({ points, insights, symbol }: { points: Point[]; insights: Insight[]; symbol: string }) {
  return (
    <div className="rounded-[14px] bg-card px-[18px] pt-[18px] pb-2">
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-[13.5px] font-semibold text-[#ECECE8]">Evidence</span>
        <span className="text-xs text-[#6C727B]">{points.length} attached</span>
      </div>
      <p className="mt-1 text-xs text-[#6C727B]">Insights you chose to support this thesis</p>
      {points.length === 0 ? (
        <p className="mt-3 border-t border-[#16191D] py-3 text-[13px] leading-relaxed text-[#8A9199]">None yet. Edit the thesis and add a figure from the filings.</p>
      ) : (
        points.map((point) => {
          const area = insights.find((item) => item.id === point.source)?.area ?? "Research";
          const href = area === "Growth" || area === "Profitability" ? instrumentFinancialsPath(symbol) : instrumentResearchPath(symbol);
          return (
            <div key={point.id} className="border-t border-[#16191D] py-3">
              <p className="text-[13.5px] leading-snug text-[#C9CBC6]">“{point.text}”</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className="rounded-[5px] bg-[#16191D] px-1.5 py-0.5 text-[#9BA1A9]">{area}</span>
                <Link href={href} className="text-[#6C727B] hover:text-[#AAB5EA]">
                  Source: {area === "Research" ? "Research" : "Financials"}
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SourceMark({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] whitespace-nowrap text-[#6C727B]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
      {label}
    </span>
  );
}

function Section({
  index,
  kicker,
  title,
  hint,
  children,
}: {
  index: string;
  kicker: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#16191D] py-7">
      <div className="flex gap-3.5">
        <span className="w-5 shrink-0 text-xs font-semibold text-[#5E646D]">{index}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-[#6C727B] uppercase">{kicker}</div>
          <h3 className="mt-2 text-[19px] font-medium tracking-[-0.01em] text-[#ECECE8]">{title}</h3>
          {hint ? <p className="mt-1 text-[13.5px] text-[#8A9199]">{hint}</p> : null}
          {children}
        </div>
      </div>
    </section>
  );
}

function PointList({
  points,
  placeholder,
  tone = "plain",
  onChange,
  onRemove,
}: {
  points: Point[];
  placeholder: string;
  tone?: "plain" | "risk";
  onChange: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      {points.map((point) => (
        <div key={point.id} className={`flex items-start gap-3 rounded-[10px] px-4 py-2.5 ${tone === "risk" ? "bg-[rgba(194,162,122,0.05)]" : "bg-card"}`}>
          <span className={`mt-2.5 shrink-0 ${tone === "risk" ? "mt-3 h-0.5 w-2 rounded-sm bg-[#B89A74]" : "h-[5px] w-[5px] rounded-full bg-[#8A9199]"}`} />
          <textarea
            rows={1}
            value={point.text}
            placeholder={placeholder}
            onInput={grow}
            onChange={(event) => onChange(point.id, event.target.value)}
            className="min-w-0 flex-1 resize-none bg-transparent text-[14.5px] leading-relaxed text-[#DCDDD8] outline-none placeholder:text-[#5E646D]"
          />
          {point.source ? <span className="mt-0.5 shrink-0 rounded-[5px] bg-[#16191D] px-1.5 py-0.5 text-[11px] whitespace-nowrap text-[#7C828B]">From filings</span> : null}
          <RemoveButton onClick={() => onRemove(point.id)} />
        </div>
      ))}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-2.5 h-[30px] rounded-lg px-2.5 text-[13px] font-medium text-[#8A9199] hover:bg-[#141719] hover:text-[#ECECE8]">
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Remove" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#484D55] hover:bg-[#1A1D22] hover:text-[#BDC3CB]">
      <X size={11} strokeWidth={2.2} />
    </button>
  );
}

function grow(event: FormEvent<HTMLTextAreaElement>) {
  const field = event.currentTarget;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
}

function hydrate(
  thesis: Thesis,
  setView: (value: string) => void,
  setWhy: (value: Point[]) => void,
  setDrivers: (value: Point[]) => void,
  setRisks: (value: Point[]) => void,
  setConds: (value: Point[]) => void,
  setStatus: (value: Status) => void,
  setSavedAt: (value: string | null) => void,
  setCreatedAt: (value: string | null) => void,
  setSnapshot: (value: ValuationSnapshot | null) => void,
) {
  const doc = parsePoints(thesis.points);
  setView(thesis.thesisBody ?? "");
  setWhy(doc.why.length ? doc.why : [EMPTY()]);
  setDrivers(doc.drivers);
  setRisks(doc.risks.length ? doc.risks : [EMPTY()]);
  const conditions = (thesis.invalidation ?? "").split("\n").map((text) => text.trim()).filter(Boolean).map((text) => ({ id: uid(), text }));
  setConds(conditions.length ? conditions : [EMPTY()]);
  setStatus(doc.status === "draft" ? "draft" : "saved");
  setSavedAt(formatWhen(thesis.updatedAt ?? thesis.createdAt));
  setCreatedAt(formatWhen(thesis.createdAt));
  setSnapshot(doc.snapshot);
}

function parsePoints(raw: string | null): { status: Status; why: Point[]; drivers: Point[]; risks: Point[]; snapshot: ValuationSnapshot | null } {
  const empty = { status: "saved" as Status, why: [] as Point[], drivers: [] as Point[], risks: [] as Point[], snapshot: null };
  if (!raw) {
    return empty;
  }
  try {
    const parsed = JSON.parse(raw) as {
      status?: Status;
      why?: Point[];
      drivers?: Point[];
      risks?: Point[];
      snapshot?: ValuationSnapshot | null;
    };
    return {
      status: parsed.status === "draft" ? "draft" : "saved",
      why: Array.isArray(parsed.why) ? parsed.why.filter((point) => point?.text) : [],
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers.filter((point) => point?.text) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((point) => point?.text) : [],
      snapshot: parsed.snapshot?.date ? parsed.snapshot : null,
    };
  } catch {
    return empty;
  }
}

function captureSnapshot(company: CompanyProfile, lines: StatementLine[]): ValuationSnapshot {
  const last = lines[lines.length - 1];
  const fcf = last?.cashFlow.freeCashFlow ?? null;
  const cap = company.quote?.marketCap ?? null;
  const price = company.quote?.price ?? null;
  const pe = currentPe(company, lines);
  const forward = company.financials?.forwardPe;
  return {
    price: formatPrice(price, company.currency ?? "USD"),
    pe: pe != null && pe > 0 ? `${pe.toFixed(1)}x` : null,
    forwardPe: forward != null && forward > 0 ? `${forward.toFixed(1)}x` : null,
    priceToFcf: cap != null && fcf != null && fcf > 0 ? `${(cap / fcf).toFixed(1)}x` : null,
    date: formatWhen(new Date().toISOString()) ?? "",
  };
}

function watchingNow(company: CompanyProfile, lines: StatementLine[], currency: string) {
  const last = lines[lines.length - 1];
  const previous = lines.length > 1 ? lines[lines.length - 2] : null;
  const revenueChange = previous ? growth(last?.income.revenue, previous.income.revenue) : null;
  const operating = last ? percentOf(last.income.operatingIncome, last.income.revenue) : null;
  const fcf = last?.cashFlow.freeCashFlow ?? null;
  const pe = currentPe(company, lines);
  return [
    { label: "Revenue growth", value: revenueChange == null ? null : signed(revenueChange) },
    { label: "Operating margin", value: operating == null ? null : `${operating.toFixed(1)}%` },
    { label: "Free cash flow", value: formatCompactMoney(fcf, currency) },
    { label: "P/E", value: pe != null && pe > 0 ? `${pe.toFixed(1)}x` : null },
  ].filter((item): item is { label: string; value: string } => item.value != null);
}

function currentPe(company: CompanyProfile, lines: StatementLine[]) {
  const reported = company.financials?.peRatio;
  if (reported != null && reported > 0) {
    return reported;
  }
  const last = lines[lines.length - 1];
  const price = company.quote?.price ?? null;
  const eps = last?.income.epsDiluted ?? last?.income.eps ?? null;
  return price != null && eps != null && eps > 0 ? price / eps : null;
}

function buildInsights(lines: StatementLine[], currency: string): Insight[] {
  const first = lines[0];
  const last = lines[lines.length - 1];
  if (!first || !last || first === last) {
    return [];
  }
  const insights: Insight[] = [];
  const years = Math.max(1, lines.length - 1);
  const revenueGrowth = cagr(first.income.revenue, last.income.revenue, years);
  if (revenueGrowth != null) {
    insights.push({
      id: "revenue-cagr",
      text: `Revenue ${revenueGrowth >= 0 ? "grew" : "changed"} ${signed(revenueGrowth)} a year from ${first.label} to ${last.label}.`,
      area: "Growth",
      target: revenueGrowth >= 0 ? "why" : "risks",
    });
  }
  const startMargin = percentOf(first.income.grossProfit, first.income.revenue);
  const endMargin = percentOf(last.income.grossProfit, last.income.revenue);
  if (startMargin != null && endMargin != null && Math.abs(endMargin - startMargin) >= 1) {
    const wider = endMargin > startMargin;
    insights.push({
      id: "gross-margin",
      text: `Gross margin moved from ${startMargin.toFixed(1)}% to ${endMargin.toFixed(1)}%.`,
      area: "Profitability",
      target: wider ? "why" : "risks",
    });
  }
  const fcf = last.cashFlow.freeCashFlow;
  if (fcf != null) {
    insights.push({
      id: "fcf",
      text: `Free cash flow was ${formatCompactMoney(fcf, currency) ?? "reported"} in ${last.label}.`,
      area: "Profitability",
      target: fcf > 0 ? "why" : "risks",
    });
  }
  return insights.slice(0, 3);
}

type Draft = { view: string; why: Point[]; drivers: Point[]; risks: Point[]; conds: Point[] };

function readDraft(symbol: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(symbol));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(symbol: string, draft: Draft) {
  window.localStorage.setItem(draftKey(symbol), JSON.stringify(draft));
}

function clearDraft(symbol: string) {
  window.localStorage.removeItem(draftKey(symbol));
}

function draftKey(symbol: string) {
  return `quantora.thesis.${symbol}`;
}

function filled(points: Point[]) {
  return points.some((point) => point.text.trim());
}

function kept(points: Point[]) {
  return points.filter((point) => point.text.trim()).map((point) => ({ ...point, text: point.text.trim() }));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatWhen(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function growth(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function percentOf(numer: number | null | undefined, denom: number | null | undefined) {
  if (numer == null || denom == null || denom === 0) {
    return null;
  }
  return (numer / denom) * 100;
}

function cagr(first: number | null | undefined, last: number | null | undefined, years: number) {
  if (first == null || last == null || first <= 0 || last <= 0 || years <= 0) {
    return null;
  }
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function signed(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

const VERDICT_OPTIONS: { value: ReviewVerdict; label: string }[] = [
  { value: "STILL_VALID", label: "Still valid" },
  { value: "WATCHING", label: "Watching" },
  { value: "INVALIDATED", label: "Invalidated" },
];

function verdictLabel(verdict: ReviewVerdict) {
  return VERDICT_OPTIONS.find((option) => option.value === verdict)?.label ?? verdict;
}

function verdictDot(verdict: ReviewVerdict) {
  if (verdict === "INVALIDATED") {
    return "bg-[#B89A74]";
  }
  if (verdict === "WATCHING") {
    return "bg-[#7C828B]";
  }
  return "bg-[#8E9CE0]";
}
