"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OptionCard, OptionChip } from "@/components/onboarding/option-card";
import { useAuth } from "@/components/auth/auth-provider";
import {
  APPROACH_OPTIONS,
  CONTRIB_OPTIONS,
  DEBT_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  HORIZON_OPTIONS,
  KNOWLEDGE_OPTIONS,
  PERIOD_OPTIONS,
  QUESTION_COUNT,
  RISK_OPTIONS,
  SAVINGS_OPTIONS,
  answersFromResponse,
  canContinue,
  emptyAnswers,
  getOnboarding,
  resumeStep,
  saveOnboarding,
  summaryLabels,
  toggleKnowledge,
  type OnboardingAnswers,
} from "@/lib/onboarding";

type OnboardingWizardProps = {
  firstName: string;
};

export function OnboardingWizard({ firstName }: OnboardingWizardProps) {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
  const [whyOpen, setWhyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaveToLogin = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  const handleAuthError = useCallback(
    async (err: unknown, fallback: string) => {
      const message = err instanceof Error ? err.message : fallback;
      if (message === "Unauthorized") {
        await leaveToLogin();
        return true;
      }
      setError(message);
      return false;
    },
    [leaveToLogin]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getOnboarding();
        if (cancelled) {
          return;
        }
        updateUser({ onboardingCompleted: profile.completed });
        const nextAnswers = answersFromResponse(profile);
        setAnswers(nextAnswers);
        setStep(resumeStep(nextAnswers, profile.completed));
      } catch (err) {
        if (!cancelled) {
          await handleAuthError(err, "Could not load your answers.");
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

  const persist = useCallback(
    async (nextAnswers: OnboardingAnswers) => {
      const profile = await saveOnboarding(nextAnswers);
      updateUser({ onboardingCompleted: profile.completed });
      return profile;
    },
    [updateUser]
  );

  const goNext = useCallback(async () => {
    if (!canContinue(step, answers) || saving) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (step >= 1) {
        await persist(answers);
      }
      setStep((current) => Math.min(current + 1, 8));
    } catch (err) {
      await handleAuthError(err, "Could not save your answers.");
    } finally {
      setSaving(false);
    }
  }, [answers, handleAuthError, persist, saving, step]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Enter" && canContinue(step, answers)) {
        event.preventDefault();
        void goNext();
      }
      if (event.key === "Escape" && step > 0 && step < 8) {
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answers, goBack, goNext, step]);

  function patch(partial: Partial<OnboardingAnswers>) {
    setAnswers((current) => ({ ...current, ...partial }));
  }

  const inQuestions = step >= 1 && step <= QUESTION_COUNT;
  const progress = step === 8 ? 100 : (step / QUESTION_COUNT) * 100;
  const stepLabel =
    inQuestions ? `Step ${step} of ${QUESTION_COUNT}` : step === 8 ? "Setup complete" : "About 2 minutes";
  const readyToContinue = inQuestions && canContinue(step, answers);
  const labels = summaryLabels(answers);

  async function goToDashboard() {
    setError(null);
    setSaving(true);
    try {
      const profile = await persist(answers);
      updateUser({ onboardingCompleted: profile.completed });
      router.replace("/home");
    } catch (err) {
      await handleAuthError(err, "Could not save your plan.");
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0D0F12]" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0F12] text-[#F2F3F5]">
      <header className="sticky top-0 z-10 bg-[#0D0F12]">
        <div className="mx-auto flex max-w-[1080px] items-center gap-5 px-8 pt-[22px] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#1B1F26] text-xs font-semibold text-[#7C8CF8]">
              Q
            </span>
            <span className="text-[11.5px] font-semibold tracking-[0.17em] text-[#F2F3F5]">QUANTORA</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-[12.5px] text-[#949BA5]">
            <span>{stepLabel}</span>
            <button type="button" className="hover:text-[#F2F3F5]" onClick={() => void leaveToLogin()}>
              Sign out
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-[#191D23]">
          <div className="h-full bg-[#7C8CF8] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-8">
        <div className="mx-auto w-full max-w-[660px] flex-1 py-10 md:py-[76px]">
          {step === 0 ? <WelcomeStep firstName={firstName} onStart={() => setStep(1)} /> : null}
          {step === 1 ? (
            <Question
              title="What are you investing for?"
              subtitle="Choose what feels closest to your goal today."
            >
              <div className="flex flex-col gap-2.5">
                {GOAL_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={answers.goal === option.value}
                    title={option.title}
                    subtitle={option.subtitle}
                    check
                    onClick={() => patch({ goal: option.value })}
                  />
                ))}
              </div>
            </Question>
          ) : null}
          {step === 2 ? (
            <Question
              title="When might you need this money?"
              subtitle="Your time horizon is simply how long your money can stay invested before you may need it."
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
                {HORIZON_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    compact
                    selected={answers.timeHorizon === option.value}
                    title={option.label}
                    muted={option.muted}
                    onClick={() => patch({ timeHorizon: option.value })}
                  />
                ))}
              </div>
            </Question>
          ) : null}
          {step === 3 ? (
            <Question
              title="Before investing, where are you today?"
              subtitle="Two short questions. Nothing here is judged."
            >
              <div className="mt-2">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[#949BA5]">EMERGENCY SAVINGS</div>
                <div className="mt-3 text-[16.5px] font-medium text-[#F2F3F5]">
                  Do you have money set aside for unexpected expenses?
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {SAVINGS_OPTIONS.map((option) => (
                    <OptionChip
                      key={option.value}
                      selected={answers.emergencyFund === option.value}
                      label={option.label}
                      muted={option.muted}
                      onClick={() => patch({ emergencyFund: option.value })}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-[34px] border-t border-[#1E2228] pt-[30px]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[#949BA5]">HIGH-INTEREST DEBT</div>
                <div className="mt-3 text-[16.5px] font-medium text-[#F2F3F5]">
                  Do you currently have high-interest debt?
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {DEBT_OPTIONS.map((option) => (
                    <OptionChip
                      key={option.value}
                      selected={answers.highInterestDebt === option.value}
                      label={option.label}
                      muted={option.muted}
                      onClick={() => patch({ highInterestDebt: option.value })}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="mt-7 text-[13px] font-medium text-[#7C8CF8] hover:text-[#99A6FF]"
                onClick={() => setWhyOpen((open) => !open)}
              >
                Why does this matter?
              </button>
              {whyOpen ? (
                <div className="mt-3.5 rounded-xl border border-[#292D33] bg-[#14171B] px-5 py-[18px] text-[13.5px] leading-relaxed text-[#949BA5]">
                  Money you might need soon is hard to keep invested, and debt that costs more than your investments
                  are likely to earn works against you. Knowing this simply helps Quantora choose what to teach you first
                  — it never blocks you from continuing.
                </div>
              ) : null}
            </Question>
          ) : null}
          {step === 4 ? (
            <Question title="How do you plan to invest?" subtitle="Your current preference. You can change it anytime.">
              <div className="flex flex-col gap-2.5">
                {CONTRIB_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={answers.contributionPlan === option.value}
                    title={option.title}
                    subtitle={option.subtitle}
                    check
                    onClick={() =>
                      patch({
                        contributionPlan: option.value,
                        amountSkipped: option.value === "REGULARLY" ? answers.amountSkipped : false,
                      })
                    }
                  />
                ))}
              </div>
              {answers.contributionPlan === "REGULARLY" && !answers.amountSkipped ? (
                <div className="mt-[22px] border-t border-[#1E2228] pt-[26px]">
                  <div className="text-[16.5px] font-medium text-[#F2F3F5]">How much would you like to invest?</div>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <label className="flex h-12 items-center gap-2.5 rounded-[10px] border border-[#292D33] bg-[#14171B] px-4 focus-within:border-[#4A5270]">
                      <span className="text-[17px] text-[#949BA5]">€</span>
                      <input
                        value={answers.monthlyContribution}
                        onChange={(event) =>
                          patch({ monthlyContribution: event.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-24 bg-transparent text-[19px] font-medium text-[#F2F3F5] outline-none"
                        inputMode="numeric"
                      />
                    </label>
                    {PERIOD_OPTIONS.map((option) => (
                      <OptionChip
                        key={option.value}
                        selected={answers.contributionPeriod === option.value}
                        label={option.label}
                        onClick={() => patch({ contributionPeriod: option.value })}
                      />
                    ))}
                  </div>
                  <div className="mt-3.5 flex items-center gap-[18px]">
                    <span className="text-[12.5px] text-[#949BA5]">This is just your target. You can change it anytime.</span>
                    <button
                      type="button"
                      className="ml-auto text-[13px] text-[#949BA5] hover:text-[#F2F3F5]"
                      onClick={() => patch({ amountSkipped: true })}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              ) : null}
            </Question>
          ) : null}
          {step === 5 ? (
            <Question title="Imagine you invested €10,000.">
              <div className="rounded-[14px] border border-[#292D33] bg-[#14171B] px-6 py-[22px]">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[#949BA5]">A FEW MONTHS LATER</div>
                <div className="mt-[18px] flex flex-wrap items-center gap-[22px]">
                  <div>
                    <div className="text-[12.5px] text-[#949BA5]">You invested</div>
                    <div className="mt-1 text-[22px] font-light text-[#949BA5]">€10,000</div>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#949BA5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 4v16M6 14l6 6 6-6" />
                  </svg>
                  <div>
                    <div className="text-[12.5px] text-[#949BA5]">Now worth</div>
                    <div className="mt-1 text-[28px] font-normal text-[#F2F3F5]">€7,500</div>
                  </div>
                  <div className="ml-auto text-sm font-semibold text-[#C1605A]">−25%</div>
                </div>
              </div>
              <div className="mt-[30px] text-[16.5px] font-medium text-[#F2F3F5]">How would you most likely react?</div>
              <div className="mt-4 flex flex-col gap-2.5">
                {RISK_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    compact
                    selected={answers.riskReaction === option.value}
                    title={option.title}
                    subtitle={option.subtitle}
                    onClick={() => patch({ riskReaction: option.value })}
                  />
                ))}
              </div>
            </Question>
          ) : null}
          {step === 6 ? (
            <Question title="How familiar are you with investing?">
              <div className="flex flex-col gap-2.5">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    compact
                    selected={answers.experience === option.value}
                    title={option.title}
                    subtitle={option.subtitle}
                    onClick={() => patch({ experience: option.value })}
                  />
                ))}
              </div>
              {answers.experience ? (
                <div className="mt-7 border-t border-[#1E2228] pt-[26px]">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <div className="text-[16.5px] font-medium text-[#F2F3F5]">What do you already understand?</div>
                    <div className="text-[12.5px] text-[#949BA5]">Optional</div>
                  </div>
                  <div className="mt-2 text-[13px] text-[#949BA5]">
                    This isn&apos;t a test. It simply helps Quantora personalize what you learn.
                  </div>
                  <div className="mt-[18px] flex flex-wrap gap-2.5">
                    {KNOWLEDGE_OPTIONS.map((option) => (
                      <OptionChip
                        key={option.value}
                        selected={answers.knowledge.includes(option.value)}
                        label={option.label}
                        muted={option.muted}
                        onClick={() => patch({ knowledge: toggleKnowledge(answers.knowledge, option.value) })}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </Question>
          ) : null}
          {step === 7 ? (
            <Question title="What sounds most like you today?" subtitle="There is no better answer here.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
                {APPROACH_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    selected={answers.approach === option.value}
                    title={option.title}
                    subtitle={option.subtitle}
                    className="rounded-[14px] p-5"
                    onClick={() => patch({ approach: option.value })}
                  />
                ))}
              </div>
            </Question>
          ) : null}
          {step === 8 ? (
            <PlanSummary
              labels={labels}
              saving={saving}
              onDashboard={() => void goToDashboard()}
              onReview={() => setStep(1)}
            />
          ) : null}

          {error ? <p className="mt-6 text-[13px] leading-relaxed text-[#D7A3A3]">{error}</p> : null}
        </div>
      </main>

      {inQuestions ? (
        <footer className="sticky bottom-0 border-t border-[#1A1E23] bg-[#0D0F12]">
          <div className="mx-auto flex max-w-[660px] items-center gap-4 px-8 py-[18px]">
            <button
              type="button"
              onClick={goBack}
              className="px-1 py-2 text-sm font-medium text-[#949BA5] hover:text-[#F2F3F5]"
            >
              ← Back
            </button>
            {readyToContinue ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void goNext()}
                className="ml-auto rounded-full bg-[#7C8CF8] px-[26px] py-[13px] text-[14.5px] font-semibold text-[#0D0F12] hover:bg-[#99A6FF] disabled:opacity-60"
              >
                {saving ? "Saving…" : step === QUESTION_COUNT ? "See my plan →" : "Continue →"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="ml-auto cursor-not-allowed rounded-full border border-[#23272D] bg-[#181B20] px-[26px] py-[13px] text-[14.5px] font-semibold text-[#5E646D]"
              >
                Continue →
              </button>
            )}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function Question({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[clamp(26px,3.2vw,34px)] font-light tracking-[-0.025em] leading-snug text-[#F2F3F5]">
        {title}
      </h1>
      {subtitle ? <p className="mt-3.5 max-w-[480px] text-[15px] leading-relaxed text-[#949BA5]">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function WelcomeStep({ firstName, onStart }: { firstName: string; onStart: () => void }) {
  return (
    <div>
      <h1 className="text-[clamp(32px,4vw,44px)] font-light tracking-[-0.03em] leading-[1.12] text-[#F2F3F5]">
        Welcome to Quantora, {firstName.trim() || "there"}.
      </h1>
      <p className="mt-[22px] text-[19px] font-light text-[#F2F3F5]">Let&apos;s build your investment plan.</p>
      <p className="mt-4 max-w-[520px] text-[15px] leading-[1.65] text-[#949BA5]">
        A few questions will help Quantora adapt your learning, research and investment process to you.
      </p>
      <div className="my-11 flex flex-wrap items-center gap-3.5 border-y border-[#1E2228] py-[26px]">
        {["Plan", "Learn", "Research", "Thesis", "Review"].map((item, index) => (
          <span key={item} className="flex items-center gap-3.5">
            {index > 0 ? <span className="h-px w-[22px] bg-[#292D33]" /> : null}
            <span className={`text-[13.5px] ${index === 0 ? "text-[#F2F3F5]" : "text-[#949BA5]"}`}>{item}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-[#7C8CF8] px-7 py-3.5 text-[14.5px] font-semibold text-[#0D0F12] hover:bg-[#99A6FF]"
        >
          Let&apos;s start →
        </button>
        <span className="text-[13px] text-[#949BA5]">About 2 minutes</span>
      </div>
      <p className="mt-[26px] text-[12.5px] text-[#949BA5]">You can change everything later.</p>
    </div>
  );
}

function PlanSummary({
  labels,
  saving,
  onDashboard,
  onReview,
}: {
  labels: ReturnType<typeof summaryLabels>;
  saving: boolean;
  onDashboard: () => void;
  onReview: () => void;
}) {
  return (
    <div>
      <h1 className="text-[clamp(28px,3.4vw,38px)] font-light tracking-[-0.025em] text-[#F2F3F5]">Your starting plan</h1>
      <p className="mt-3.5 text-[15px] text-[#949BA5]">Here&apos;s what we understand so far.</p>

      <div className="mt-[30px] rounded-[14px] border border-[#292D33] bg-[#14171B] p-6">
        <div className="text-[11px] font-semibold tracking-[0.16em] text-[#949BA5]">YOUR PLAN</div>
        <div className="mt-[18px] flex flex-col">
          <SummaryRow label="Goal" value={labels.goal} />
          <SummaryRow label="Time" value={labels.horizon} />
          <SummaryRow label="Contribution" value={labels.contribution} />
          <SummaryRow label="Experience" value={labels.experience} />
          <SummaryRow label="Approach" value={labels.approach} last />
        </div>
      </div>

      <div className="mt-3.5 rounded-[14px] border border-[#292D33] bg-[#14171B] p-6">
        <div className="text-[11px] font-semibold tracking-[0.16em] text-[#949BA5]">FOUNDATION</div>
        <div className="mt-4 flex flex-col gap-[11px]">
          {["Goal", "Time horizon", "Contribution", "How you react to losses", "Approach"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-[13.5px] text-[#F2F3F5]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6FA383" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12.5 9.5 18 20 6.5" />
              </svg>
              {item}
            </div>
          ))}
          <div className="flex items-center gap-3 text-[13.5px] text-[#949BA5]">
            <span className="h-[13px] w-[13px] shrink-0 rounded-full border-[1.5px] border-[#2E333A]" />
            Target allocation
            <span className="ml-auto text-[12.5px] text-[#949BA5]">Not defined yet</span>
          </div>
          <div className="flex items-center gap-3 text-[13.5px] text-[#949BA5]">
            <span className="h-[13px] w-[13px] shrink-0 rounded-full border-[1.5px] border-[#2E333A]" />
            Personal rules
            <span className="ml-auto text-[12.5px] text-[#949BA5]">Not defined yet</span>
          </div>
        </div>
        <div className="mt-[18px] text-[12.5px] leading-relaxed text-[#949BA5]">
          Quantora leaves these to you. You&apos;ll define them yourself, once you&apos;ve learned enough to decide.
        </div>
      </div>

      <div className="mt-[38px]">
        <div className="text-[16.5px] font-medium text-[#F2F3F5]">A good place to start</div>
        <div className="mt-4 flex flex-col gap-2.5">
          <LessonCard index="01" title="Risk & return" body="Understand why investments move and what risk really means." time="3 min" />
          <LessonCard index="02" title="Diversification" body="Learn why spreading your investments can reduce certain risks." time="4 min" />
          <LessonCard index="03" title="What is an ETF?" body="Understand one of the simplest ways to own many investments at once." time="4 min" />
        </div>
      </div>

      <div className="mt-[38px] flex flex-wrap items-center gap-[22px]">
        <button
          type="button"
          disabled={saving}
          onClick={onDashboard}
          className="rounded-full bg-[#7C8CF8] px-[26px] py-3.5 text-[14.5px] font-semibold text-[#0D0F12] hover:bg-[#99A6FF] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Go to my dashboard →"}
        </button>
        <Link href="/learn" className="text-sm font-medium text-[#949BA5] hover:text-[#F2F3F5]">
          Start learning
        </Link>
        <button type="button" onClick={onReview} className="ml-auto text-[12.5px] text-[#949BA5] hover:text-[#F2F3F5]">
          Review my answers
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex gap-5 py-[11px] ${last ? "" : "border-b border-[#1E2228]"}`}>
      <span className="w-[130px] shrink-0 text-[13.5px] text-[#949BA5]">{label}</span>
      <span className="text-[14.5px] text-[#F2F3F5]">{value}</span>
    </div>
  );
}

function LessonCard({ index, title, body, time }: { index: string; title: string; body: string; time: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-[#292D33] bg-[#14171B] px-[18px] py-4">
      <span className="pt-0.5 text-[11px] font-semibold tracking-[0.1em] text-[#7C8CF8]">{index}</span>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-[#F2F3F5]">{title}</div>
        <div className="mt-1 text-[13.5px] leading-relaxed text-[#949BA5]">{body}</div>
      </div>
      <span className="ml-auto whitespace-nowrap text-[12.5px] text-[#949BA5]">{time}</span>
    </div>
  );
}
