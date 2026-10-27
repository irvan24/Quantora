"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import {
  APPROACH_OPTIONS,
  CONTRIB_OPTIONS,
  DEBT_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  HORIZON_OPTIONS,
  PERIOD_OPTIONS,
  SAVINGS_OPTIONS,
  answersFromResponse,
  getOnboarding,
  saveOnboarding,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import {
  ALLOCATION_BUCKETS,
  CADENCE_OPTIONS,
  RULE_EXAMPLES,
  TONE_COLOR,
  allocationTotal,
  cadenceSummary,
  emptyAllocation,
  planSummaryLine,
} from "@/lib/plan";

const SELECTED = "border-[#5B6ACB]";
const IDLE = "border-[#292D33]";

export function EditPlanForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [initial, setInitial] = useState<string>("");
  const [allocOpen, setAllocOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getOnboarding();
        if (cancelled) {
          return;
        }
        const next = answersFromResponse(profile);
        setAnswers(next);
        setAllocOpen(Boolean(next.allocation));
        setInitial(JSON.stringify(next));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your plan.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!answers || typeof window === "undefined") {
      return;
    }
    const id = window.location.hash.replace("#", "");
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [answers]);

  const dirty = Boolean(answers && JSON.stringify(answers) !== initial);
  const total = allocationTotal(answers?.allocation ?? null);
  const suggestions = RULE_EXAMPLES.filter((example) => !answers?.rules.includes(example));

  const status = useMemo(() => {
    if (saved && !dirty) {
      return { label: "Saved", color: "#56A177" };
    }
    if (dirty) {
      return { label: "Unsaved changes", color: "#C79A4E" };
    }
    return { label: "No changes yet", color: "#6F7680" };
  }, [dirty, saved]);

  function patch(partial: Partial<OnboardingAnswers>) {
    setAnswers((current) => (current ? { ...current, ...partial } : current));
    setSaved(false);
    setError(null);
  }

  async function save() {
    if (!answers || saving) {
      return;
    }
    if (allocOpen && total !== 100) {
      setError("Allocation needs to add up to 100% before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const profile = await saveOnboarding({
        ...answers,
        allocation: allocOpen ? answers.allocation : null,
        reviewCadence: answers.reviewCadence ?? "EVERY_SIX_MONTHS",
      });
      const next = answersFromResponse(profile);
      setAnswers(next);
      setAllocOpen(Boolean(next.allocation));
      setInitial(JSON.stringify(next));
      setSaved(true);
      router.replace("/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your plan.");
    } finally {
      setSaving(false);
    }
  }

  function addRule(text: string) {
    const value = text.trim();
    if (!answers || !value || answers.rules.includes(value) || answers.rules.length >= 20) {
      return;
    }
    patch({ rules: [...answers.rules, value] });
    setDraft("");
  }

  if (error && !answers) {
    return <p className="px-6 py-16 text-[13px] text-[#D7A3A3] sm:px-11">{error}</p>;
  }
  if (!answers) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-[18px] border-b border-[#15181C] bg-[rgba(10,11,12,.92)] px-4 py-4 backdrop-blur-sm sm:px-11">
        <Link href="/plan" className="flex items-center gap-2.5 text-[13.5px] font-medium text-[#8A9199] hover:text-[#ECECE8]">
          <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          My Plan
        </Link>
        <div className="h-[18px] w-px bg-[#22262C]" />
        <div className="text-sm font-semibold text-[#ECECE8]">Edit plan</div>
        <div className="ml-auto flex items-center gap-3.5">
          <span className="text-[12.5px]" style={{ color: status.color }}>
            {status.label}
          </span>
          <Link href="/plan" className="flex h-[38px] items-center px-3.5 text-[13.5px] font-medium text-muted hover:text-[#ECECE8]">
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex h-[38px] items-center rounded-[10px] bg-cta px-[18px] text-[13.5px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1240px] gap-11 px-4 py-10 sm:px-11 sm:pt-10 sm:pb-20">
        <div className="flex min-w-0 flex-[1_1_640px] flex-col gap-5">
          <div className="mb-2">
            <h1 className="text-[32px] font-light tracking-[-0.025em] leading-tight text-[#ECECE8]">Edit plan</h1>
            <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-[#8A9199]">
              Change anything here. Your plan is meant to evolve slowly — nothing is locked in.
            </p>
          </div>

          {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}

          <section id="strategy" className="overflow-hidden rounded-2xl border border-[#171A1E] bg-card-alt">
            <SectionHeader title="Strategy" body="What you're investing for, and how you want to go about it." />
            <FieldRow title="Goal" note="One primary intention.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-2.5">
                {GOAL_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={answers.goal === option.value}
                    title={option.title}
                    note={option.subtitle}
                    onClick={() => patch({ goal: option.value })}
                  />
                ))}
              </div>
            </FieldRow>
            <FieldRow title="Time horizon" note="How long before you'd need this money.">
              <div className="flex flex-wrap gap-2.5">
                {HORIZON_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    selected={answers.timeHorizon === option.value}
                    label={option.label}
                    onClick={() => patch({ timeHorizon: option.value })}
                  />
                ))}
              </div>
            </FieldRow>
            <FieldRow title="Contribution" note="A number you can keep up with.">
              <div className="flex flex-col gap-2.5">
                {CONTRIB_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={answers.contributionPlan === option.value}
                    title={option.title}
                    note={option.subtitle}
                    onClick={() =>
                      patch({
                        contributionPlan: option.value,
                        amountSkipped: option.value === "REGULARLY" ? answers.amountSkipped : false,
                      })
                    }
                  />
                ))}
              </div>
              {answers.contributionPlan === "REGULARLY" ? (
                <div className="mt-4">
                  <div className="flex h-11 max-w-[220px] items-center gap-2.5 rounded-[10px] border border-[#23272E] bg-input px-3.5 focus-within:border-cta">
                    <span className="text-[15px] text-[#8A9199]">€</span>
                    <input
                      value={answers.monthlyContribution}
                      onChange={(event) =>
                        patch({
                          monthlyContribution: event.target.value.replace(/[^0-9]/g, ""),
                          amountSkipped: false,
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#ECECE8] outline-none"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {PERIOD_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        selected={answers.contributionPeriod === option.value}
                        label={option.label}
                        onClick={() => patch({ contributionPeriod: option.value, amountSkipped: false })}
                      />
                    ))}
                    {[100, 200, 300, 500].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => patch({ monthlyContribution: String(value), amountSkipped: false })}
                        className="rounded-full border border-[#22262C] px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-[#2F343C] hover:text-[#ECECE8]"
                      >
                        €{value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </FieldRow>
            <FieldRow title="Experience" note="Only changes how much Quantora explains.">
              <StackedChoices
                options={EXPERIENCE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.title,
                }))}
                selected={answers.experience}
                onSelect={(value) => patch({ experience: value })}
              />
            </FieldRow>
            <FieldRow title="Approach" note="How much you want to research yourself.">
              <div className="flex flex-col gap-2.5">
                {APPROACH_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={answers.approach === option.value}
                    title={option.title}
                    note={option.subtitle}
                    onClick={() => patch({ approach: option.value })}
                  />
                ))}
              </div>
            </FieldRow>
          </section>

          <section id="foundation" className="overflow-hidden rounded-2xl border border-[#171A1E] bg-card-alt">
            <SectionHeader title="Financial foundation" body="The basics you want in place before investing consistently." />
            <FieldRow title="Emergency savings" note="Money set aside for the unexpected.">
              <StackedChoices
                options={SAVINGS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  tone: option.value === "SEVERAL_MONTHS" ? "good" : option.value === "SOME" ? "warn" : option.value === "NOT_YET" ? "bad" : "muted",
                }))}
                selected={answers.emergencyFund}
                onSelect={(value) => patch({ emergencyFund: value })}
              />
            </FieldRow>
            <FieldRow title="High-interest debt" note="Credit cards, consumer loans.">
              <StackedChoices
                options={DEBT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  tone: option.value === "NO" ? "good" : option.value === "YES" ? "warn" : "muted",
                }))}
                selected={answers.highInterestDebt}
                onSelect={(value) => patch({ highInterestDebt: value })}
              />
            </FieldRow>
          </section>

          <section id="allocation" className="overflow-hidden rounded-2xl border border-[#171A1E] bg-card-alt">
            <div className="flex flex-wrap items-baseline gap-3.5 px-[26px] pt-[22px] pb-[19px]">
              <div className="min-w-0 flex-[1_1_260px]">
                <h2 className="text-base font-semibold text-[#ECECE8]">Target allocation</h2>
                <p className="mt-1.5 text-[13px] text-[#8A9199]">How you want to divide your investments across asset types.</p>
              </div>
              <span className="text-[11.5px] font-semibold tracking-[0.06em] text-[#8A9199] uppercase">Optional</span>
            </div>
            <div className="border-t border-[#171A1E] px-[26px] py-6">
              {allocOpen ? (
                <div className="flex flex-col gap-2.5">
                  {ALLOCATION_BUCKETS.map((bucket) => {
                    const allocation = answers.allocation ?? emptyAllocation();
                    const value = allocation[bucket.key];
                    return (
                      <div key={bucket.key} className="flex flex-wrap items-center gap-4 rounded-[11px] bg-[#121418] px-4 py-3">
                        <div className="min-w-0 flex-[1_1_190px]">
                          <div className="text-sm font-medium text-[#ECECE8]">{bucket.label}</div>
                          <div className="mt-1 text-xs text-[#8A9199]">{bucket.note}</div>
                        </div>
                        <div className="h-1 min-w-0 flex-[1_1_150px] overflow-hidden rounded-sm bg-[#1E2228]">
                          <div className="h-full rounded-sm bg-cta" style={{ width: `${Math.min(100, value)}%` }} />
                        </div>
                        <label className="flex h-9 w-24 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#23272E] bg-[#0D0F12] px-2.5 focus-within:border-cta">
                          <input
                            value={value || ""}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value.replace(/[^0-9]/g, "").slice(0, 3) || 0);
                              patch({
                                allocation: {
                                  ...(answers.allocation ?? emptyAllocation()),
                                  [bucket.key]: Math.min(100, nextValue),
                                },
                              });
                            }}
                            className="min-w-0 flex-1 bg-transparent text-right text-[14.5px] font-medium text-[#ECECE8] outline-none"
                            inputMode="numeric"
                          />
                          <span className="text-[12.5px] text-[#8A9199]">%</span>
                        </label>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-3 px-4 pt-3.5">
                    <span className="text-[12.5px] text-[#8A9199]">Total</span>
                    <span className={`text-[15px] font-semibold ${total === 100 ? "text-[#56A177]" : "text-[#ECECE8]"}`}>
                      {total}%
                    </span>
                    <span className="text-[12.5px] text-[#8A9199]">
                      {total === 100 ? "Ready to save" : total > 100 ? "Over 100% — adjust before saving" : "Needs to reach 100%"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAllocOpen(false);
                        patch({ allocation: null });
                      }}
                      className="ml-auto text-[12.5px] font-medium text-[#8A9199] hover:text-[#ECECE8]"
                    >
                      Set this later instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-7">
                  <div className="min-w-0 flex-[1_1_300px]">
                    <div className="text-sm font-medium text-[#ECECE8]">Not defined yet</div>
                    <p className="mt-1.5 max-w-[50ch] text-[13px] leading-relaxed text-[#8A9199]">
                      Quantora won&apos;t suggest percentages — the mix is yours to decide.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAllocOpen(true);
                        patch({ allocation: answers.allocation ?? emptyAllocation() });
                      }}
                      className="flex h-10 items-center rounded-[10px] border border-[#23272E] bg-[#14171B] px-[18px] text-[13.5px] font-medium text-[#DDDDD8] hover:bg-[#191C21] hover:text-white"
                    >
                      Define it now
                    </button>
                    <Link href="/learn" className="text-[13px] font-medium text-link hover:text-link-hover">
                      Learn first
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section id="rules" className="overflow-hidden rounded-2xl border border-[#171A1E] bg-card-alt">
            <div className="flex flex-wrap items-baseline gap-3.5 px-[26px] pt-[22px] pb-[19px]">
              <div className="min-w-0 flex-[1_1_260px]">
                <h2 className="text-base font-semibold text-[#ECECE8]">Your rules</h2>
                <p className="mt-1.5 text-[13px] text-[#8A9199]">Short sentences you want to hold yourself to.</p>
              </div>
              <span className="text-[12.5px] text-[#8A9199]">
                {answers.rules.length === 0 ? "None yet" : `${answers.rules.length} ${answers.rules.length === 1 ? "rule" : "rules"}`}
              </span>
            </div>
            <div className="border-t border-[#171A1E] px-[26px] py-6">
              <div className="flex flex-col gap-2.5">
                {answers.rules.map((rule) => (
                  <div key={rule} className="flex items-center gap-3 rounded-[11px] bg-[#121418] px-[15px] py-3">
                    <Check size={15} strokeWidth={2} color="#56A177" className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-[13.5px] text-[#DDDDD8]">{rule}</span>
                    <button
                      type="button"
                      onClick={() => patch({ rules: answers.rules.filter((item) => item !== rule) })}
                      className="text-[12.5px] text-[#6F7680] hover:text-[#C98484]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex h-[46px] items-center gap-2.5 rounded-[11px] border border-[#23272E] bg-input px-2 pl-[15px] focus-within:border-cta">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addRule(draft);
                      }
                    }}
                    placeholder="Write a rule, e.g. Maximum 5% in one company"
                    className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#ECECE8] outline-none placeholder:text-faint"
                  />
                  <button
                    type="button"
                    onClick={() => addRule(draft)}
                    className="flex h-8 items-center rounded-lg bg-[#1B1F25] px-3.5 text-[12.5px] font-semibold text-[#DDDDD8] hover:bg-[#232830] hover:text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            {suggestions.length > 0 ? (
              <div className="border-t border-[#171A1E] bg-[#0D0F12] px-[26px] pt-5 pb-[22px]">
                <div className="text-[10px] font-semibold tracking-[0.16em] text-[#8A9199] uppercase">
                  Examples, not recommendations
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => addRule(text)}
                      className="flex items-center gap-2 rounded-full border border-[#22262C] bg-[#14171B] px-3 py-1.5 text-[12.5px] text-[#BDC3CB] hover:bg-[#191C21] hover:text-white"
                    >
                      <Plus size={13} strokeWidth={2.2} className="text-link" aria-hidden="true" />
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section id="review" className="overflow-hidden rounded-2xl border border-[#171A1E] bg-card-alt">
            <SectionHeader title="Review cadence" body="How often you want to revisit this plan." />
            <FieldRow title="Reminder" note="How often this plan should come back on your radar.">
              <div className="flex flex-wrap gap-2.5">
                {CADENCE_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    selected={(answers.reviewCadence ?? "EVERY_SIX_MONTHS") === option.value}
                    label={option.label}
                    onClick={() => patch({ reviewCadence: option.value })}
                  />
                ))}
              </div>
            </FieldRow>
          </section>

          <div className="flex flex-wrap items-center gap-4 pt-3.5">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex h-11 items-center rounded-[11px] bg-cta px-[22px] text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link href="/plan" className="text-[13.5px] font-medium text-[#8A9199] hover:text-[#ECECE8]">
              Cancel
            </Link>
            <span className="ml-auto text-[12.5px] text-[#6F7680]">Editing your plan never changes anything you already own.</span>
          </div>
        </div>

        <aside className="sticky top-[104px] hidden w-[232px] shrink-0 flex-col gap-[26px] xl:flex">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#6F7680] uppercase">Sections</div>
            <div className="mt-3 flex flex-col">
              {[
                ["#strategy", "Strategy"],
                ["#foundation", "Financial foundation"],
                ["#allocation", "Target allocation"],
                ["#rules", "Your rules"],
                ["#review", "Review cadence"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="py-1.5 text-[13.5px] text-[#9BA1A9] hover:text-[#ECECE8]">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#171A1E] bg-card-alt px-[18px] py-4">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#8A9199] uppercase">Summary</div>
            <div className="mt-3 text-[13.5px] leading-relaxed text-[#DDDDD8]">{planSummaryLine(answers)}</div>
            <div className="mt-3 text-[12.5px] text-[#8A9199]">{cadenceSummary(answers)}</div>
          </div>
          <div className="text-xs leading-relaxed text-[#6F7680]">
            Big changes are worth sleeping on. You can come back to this page any time.
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-[26px] pt-[22px] pb-[19px]">
      <h2 className="text-base font-semibold text-[#ECECE8]">{title}</h2>
      <p className="mt-1.5 text-[13px] text-[#8A9199]">{body}</p>
    </div>
  );
}

function FieldRow({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-7 border-t border-[#171A1E] px-[26px] py-6">
      <div className="w-[190px] shrink-0">
        <div className="text-sm font-semibold text-[#ECECE8]">{title}</div>
        <div className="mt-1.5 text-[12.5px] leading-relaxed text-[#8A9199]">{note}</div>
      </div>
      <div className="min-w-0 flex-[1_1_320px]">{children}</div>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  note,
  onClick,
}: {
  selected: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border bg-[#14171B] px-[15px] py-3.5 text-left hover:bg-[#181B20] ${selected ? SELECTED : IDLE}`}
    >
      <div className="text-sm font-semibold text-[#F2F3F5]">{title}</div>
      <div className="mt-1 text-[12.5px] leading-relaxed text-[#949BA5]">{note}</div>
    </button>
  );
}

function Chip({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-[17px] py-2 text-[13.5px] font-medium hover:bg-[#181B20] ${
        selected ? `${SELECTED} text-[#F2F3F5]` : `${IDLE} text-muted`
      }`}
    >
      {label}
    </button>
  );
}

function StackedChoices<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; tone?: keyof typeof TONE_COLOR }[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-[11px] bg-[#22262C]">
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`flex items-center gap-2.5 px-[15px] py-3 text-left text-[13.5px] font-medium hover:bg-[#181B20] ${
              active ? "bg-[#181B20] text-[#F2F3F5]" : "bg-[#14171B] text-muted"
            }`}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: active ? (option.tone ? TONE_COLOR[option.tone] : "#5B6ACB") : "#2F343C" }}
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
