"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, Euro, ListChecks, Pencil, PieChart, Target, User } from "lucide-react";
import { getOnboarding } from "@/lib/onboarding";
import { ALLOCATION_BUCKETS, RULE_EXAMPLES, TONE_COLOR, allocationTotal, planView } from "@/lib/plan";

export function PlanView() {
  const [view, setView] = useState<ReturnType<typeof planView> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getOnboarding();
        if (!cancelled) {
          setView(planView(profile));
        }
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

  if (error) {
    return <p className="px-6 py-16 text-[13px] text-[#D7A3A3] sm:px-11">{error}</p>;
  }
  if (!view) {
    return <PlanSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[52px] px-4 py-10 sm:px-11 sm:py-[46px]">
      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[1_1_420px]">
          <h1 className="text-[38px] font-light tracking-[-0.025em] leading-tight text-[#ECECE8]">My Plan</h1>
          <p className="mt-3 text-[17px] text-[#CDD2D8]">Your investing framework.</p>
          <p className="mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-[#8A9199]">
            A clear view of your goals, your approach and the rules you want to follow over time.
          </p>
        </div>
        <Link
          href="/plan/edit"
          className="mt-1.5 flex h-10 items-center gap-2.5 rounded-[10px] border border-[#23272E] bg-[#14171B] px-[17px] text-[13.5px] font-medium text-[#DDDDD8] hover:bg-[#191C21] hover:text-white"
        >
          <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
          Edit plan
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[20px] bg-card px-[38px] pt-9 pb-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-40px] bottom-[-30px] h-[118%] w-[62%] bg-[radial-gradient(52%_58%_at_68%_42%,rgba(91,106,203,.17),rgba(91,106,203,0)_72%)]" />
          <svg viewBox="0 0 620 300" preserveAspectRatio="none" className="absolute right-0 bottom-0 h-[88%] w-[60%] opacity-50" aria-hidden="true">
            <path d="M0 300V216l86-48 74 40 92-72 78 56 96-104 88 70 106-58V300z" fill="#171B22" />
            <path d="M120 300V248l96-56 84 46 104-84 92 68 124-66V300z" fill="#1B202A" />
            <path d="M300 300v-34l108-70 82 60 130-72V300z" fill="#222836" />
            <path d="M0 232l86-48 74 40 92-72 78 56 96-104 88 70 106-58" fill="none" stroke="#3A4360" strokeWidth="1.2" strokeOpacity=".7" />
          </svg>
          <div className="absolute inset-0 bg-[linear-gradient(100deg,#111316_0%,#111316_34%,rgba(17,19,22,.86)_52%,rgba(17,19,22,.15)_88%)]" />
        </div>
        <div className="relative">
          <div className="text-[10.5px] font-semibold tracking-[0.18em] text-link uppercase">Your strategy</div>
          <h2 className="mt-5 max-w-[22ch] text-[33px] font-normal tracking-[-0.02em] leading-snug text-[#ECECE8]">
            {view.goalTitle}
          </h2>
          <p className="mt-3.5 max-w-[46ch] text-[15px] leading-relaxed text-muted">{view.goalBlurb}</p>
          <div className="mt-[38px] flex flex-wrap gap-px overflow-hidden rounded-[13px] bg-[#1E222A]">
            <Metric icon="time" label="Time horizon" value={view.horizon} />
            <Metric icon="money" label="Contribution" value={view.contribution} />
            <Metric icon="user" label="Experience" value={view.experience} />
            <Metric icon="target" label="Approach" value={view.approach} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline gap-4 border-b border-[#191C20] pb-4">
          <h3 className="text-[10.5px] font-semibold tracking-[0.18em] text-[#8A9199] uppercase">Financial foundation</h3>
          <span className="min-w-0 flex-[1_1_260px] text-[13.5px] text-[#8A9199]">
            The basics you want in place before investing consistently.
          </span>
          <Link href="/plan/edit#foundation" className="text-[13px] font-medium text-link hover:text-link-hover">
            Update →
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-start gap-x-14 gap-y-9">
          <FoundationStat label="Emergency savings" item={view.savings} />
          <FoundationStat label="High-interest debt" item={view.debt} />
          {view.showSavingsLesson ? (
            <Link
              href="/learn"
              className="block min-w-0 flex-[1_1_280px] rounded-xl border border-[#171A1E] bg-card-alt px-[18px] py-4 hover:bg-[#121418]"
            >
              <div className="text-[10px] font-semibold tracking-[0.16em] text-[#8A9199] uppercase">Worth understanding</div>
              <div className="mt-2 text-[13.5px] leading-relaxed text-[#DDDDD8]">
                Why emergency savings matter before investing.
              </div>
              <div className="mt-2.5 text-[12.5px] font-medium text-link">Learn →</div>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[1_1_440px] flex-col rounded-[18px] bg-card px-[30px] pt-7 pb-[26px]">
          <h3 className="text-[19px] font-medium tracking-[-0.01em] text-[#ECECE8]">Your target allocation</h3>
          <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-[#8A9199]">
            How you want to divide your investments across asset types.
          </p>
          {view.allocation ? (
            <div className="mt-6 flex flex-col gap-2.5 border-y border-[#191C20] py-6">
              {ALLOCATION_BUCKETS.map((bucket) => {
                const value = view.allocation?.[bucket.key] ?? 0;
                return (
                  <div key={bucket.key} className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-[1_1_160px] text-sm text-[#ECECE8]">{bucket.label}</div>
                    <div className="h-1 min-w-0 flex-[1_1_120px] overflow-hidden rounded-sm bg-[#1E2228]">
                      <div className="h-full rounded-sm bg-cta" style={{ width: `${Math.min(100, value)}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm font-medium text-[#ECECE8]">{value}%</div>
                  </div>
                );
              })}
              <div className="pt-2 text-[12.5px] text-[#8A9199]">Total {allocationTotal(view.allocation)}%</div>
            </div>
          ) : (
            <EmptyPanel
              icon="allocation"
              title="You haven't defined your target allocation yet."
              body="Learn how allocation works, then set targets that reflect your own plan."
              primary={{ href: "/plan/edit#allocation", label: "Define my allocation" }}
              secondary={{ href: "/learn", label: "Learn about allocation" }}
            />
          )}
          <div className="mt-[18px] text-xs leading-relaxed text-[#6F7680]">Quantora never sets targets for you. You decide the mix.</div>
        </section>

        <section className="flex min-w-0 flex-[1_1_440px] flex-col rounded-[18px] bg-card px-[30px] pt-7 pb-[26px]">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-[19px] font-medium tracking-[-0.01em] text-[#ECECE8]">Your rules</h3>
            {view.rules.length > 0 ? (
              <span className="text-[12.5px] text-[#8A9199]">
                {view.rules.length} {view.rules.length === 1 ? "rule" : "rules"}
              </span>
            ) : null}
          </div>
          <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-[#8A9199]">
            Personal rules keep your decisions consistent over time.
          </p>
          {view.rules.length > 0 ? (
            <div className="mt-6 flex flex-col">
              {view.rules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 border-t border-[#191C20] py-3">
                  <Check size={15} strokeWidth={2} color="#56A177" className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-[#DDDDD8]">{rule}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <EmptyPanel
                icon="rules"
                title="You haven't created any investing rules yet."
                body="Define a few simple rules to guide future decisions."
                primary={{ href: "/plan/edit#rules", label: "Add my first rule" }}
                secondaryAction={{
                  label: showExamples ? "Hide examples" : "See examples",
                  onClick: () => setShowExamples((open) => !open),
                }}
              />
              {showExamples ? (
                <div className="mt-5 rounded-xl border border-[#171A1E] bg-card-alt px-5 py-[18px]">
                  <div className="text-[10px] font-semibold tracking-[0.16em] text-[#8A9199] uppercase">
                    Examples from other investors
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {RULE_EXAMPLES.slice(0, 4).map((example) => (
                      <span key={example} className="rounded-lg bg-[#161A1F] px-3 py-2 text-[13px] text-[#BDC3CB]">
                        {example}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3.5 text-xs leading-relaxed text-[#6F7680]">
                    These are examples, not recommendations. Your rules are yours to write.
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl border border-[#171A1E] bg-card-alt px-[26px] pt-6 pb-[22px]">
          <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Contributions</h3>
          <div className="mt-5 flex flex-wrap gap-6">
            <MiniStat label="Target" value={view.contributionTarget} />
            <MiniStat label="This month" value="Not tracked yet" muted />
          </div>
          <p className="mt-[22px] border-t border-[#191C20] pt-[18px] text-[13px] leading-relaxed text-[#8A9199]">
            Start recording investments to track your contribution progress.
          </p>
          <div className="mt-auto pt-[18px]">
            <TextLink href="/portfolio">Record a contribution</TextLink>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl border border-[#171A1E] bg-card-alt px-[26px] pt-6 pb-[22px]">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Plan review</h3>
            {view.upToDate ? (
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#8A9199]">
                <Check size={13} strokeWidth={2} color="#56A177" aria-hidden="true" />
                Plan up to date
              </span>
            ) : (
              <span className="text-[12.5px] text-[#8A9199]">Needs a review</span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-6">
            <MiniStat label="Last reviewed" value={view.lastReviewed ?? "Not reviewed yet"} />
            <MiniStat label="Next review" value={view.nextReview} />
          </div>
          <p className="mt-[22px] border-t border-[#191C20] pt-[18px] text-[13px] leading-relaxed text-[#8A9199]">
            Your goals can change. Review your plan periodically to make sure it still reflects what you want.
          </p>
          <div className="mt-auto pt-[18px]">
            <TextLink href="/plan/edit#review" muted>
              Review plan early
            </TextLink>
          </div>
        </section>
      </div>

      <div className="text-[12.5px] text-[#6F7680]">Quantora helps you think. It never tells you what to buy.</div>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] animate-pulse flex-col gap-[52px] px-4 py-10 sm:px-11 sm:py-[46px]" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          <div className="h-9 w-40 rounded bg-card" />
          <div className="h-5 w-56 rounded bg-card" />
        </div>
        <div className="h-10 w-28 rounded-[10px] bg-card" />
      </div>
      <div className="h-[280px] rounded-[20px] bg-card" />
      <div className="flex flex-col gap-6">
        <div className="h-4 w-48 rounded bg-card" />
        <div className="flex flex-wrap gap-x-14 gap-y-9">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 w-48 rounded bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "time" | "money" | "user" | "target";
}) {
  return (
    <div className="min-w-0 flex-[1_1_180px] bg-[rgba(20,22,26,.92)] px-5 py-[18px]">
      <div className="flex items-center gap-2">
        <MetricIcon name={icon} />
        <span className="text-[10.5px] font-semibold tracking-[0.14em] text-[#8A9199] uppercase">{label}</span>
      </div>
      <div className="mt-3 text-[16.5px] font-medium text-[#ECECE8]">{value}</div>
    </div>
  );
}

function MetricIcon({ name }: { name: "time" | "money" | "user" | "target" }) {
  const props = { size: 14, strokeWidth: 1.7, color: "#8A9199", "aria-hidden": true } as const;
  if (name === "time") {
    return <Clock {...props} />;
  }
  if (name === "money") {
    return <Euro {...props} />;
  }
  if (name === "user") {
    return <User {...props} />;
  }
  return <Target {...props} />;
}

function FoundationStat({
  label,
  item,
}: {
  label: string;
  item: { label: string; tone: keyof typeof TONE_COLOR } | null;
}) {
  return (
    <div className="min-w-0 flex-[1_1_200px]">
      <div className="text-[12.5px] text-[#8A9199]">{label}</div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: item ? TONE_COLOR[item.tone] : "#6F7680" }}
        />
        <span className="text-base font-medium text-[#ECECE8]">{item?.label ?? "Not set yet"}</span>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  body,
  primary,
  secondary,
  secondaryAction,
}: {
  icon: "allocation" | "rules";
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mt-[26px] flex flex-col items-center gap-4 border-y border-[#191C20] py-7 text-center">
      {icon === "allocation" ? (
        <PieChart size={46} strokeWidth={1.4} color="#3A4256" aria-hidden="true" />
      ) : (
        <ListChecks size={46} strokeWidth={1.4} color="#3A4256" aria-hidden="true" />
      )}
      <div>
        <div className="text-[15.5px] font-medium text-[#ECECE8]">{title}</div>
        <p className="mx-auto mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-[#8A9199]">{body}</p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        <Link
          href={primary.href}
          className="flex h-10 items-center rounded-[10px] bg-cta px-[18px] text-[13.5px] font-semibold text-white hover:bg-cta-hover"
        >
          {primary.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="flex h-10 items-center rounded-[10px] border border-[#23272E] px-4 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-white"
          >
            {secondary.label}
          </Link>
        ) : null}
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="flex h-10 items-center rounded-[10px] border border-[#23272E] px-4 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-white"
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0 flex-[1_1_120px]">
      <div className="text-[10.5px] font-semibold tracking-[0.16em] text-[#8A9199] uppercase">{label}</div>
      <div className={`mt-2.5 text-[19px] tracking-[-0.01em] ${muted ? "text-[#6F7680]" : "text-[#ECECE8]"}`}>{value}</div>
    </div>
  );
}

function TextLink({ href, children, muted }: { href: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-[13px] font-medium ${muted ? "text-[#8A9199] hover:text-link" : "text-link hover:text-link-hover"}`}
    >
      {children}
      <ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />
    </Link>
  );
}
