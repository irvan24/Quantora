import {
  APPROACH_SUMMARY,
  EXP_SUMMARY,
  GOAL_SUMMARY,
  HORIZON_SUMMARY,
  answersFromResponse,
  parsedAmount,
  summaryLabels,
  type AllocationSnapshot,
  type EmergencyFund,
  type HighInterestDebt,
  type InvestingExperience,
  type InvestmentGoal,
  type OnboardingAnswers,
  type OnboardingResponse,
  type ReviewCadence,
} from "@/lib/onboarding";

export const GOAL_BLURB: Record<InvestmentGoal, string> = {
  BUILD_WEALTH: "Grow your wealth progressively while staying focused on a long-term process.",
  FUTURE_PURCHASE: "Keep this money invested with a purchase in mind, without treating it as cash you may need tomorrow.",
  ADDITIONAL_INCOME: "Build investments that may provide income over time, at a pace that still fits your horizon.",
  PRESERVE_SAVINGS: "Focus on protecting purchasing power while you decide how much risk you are willing to take.",
  STILL_FIGURING_OUT: "You can keep learning while this plan stays light and easy to change.",
};

export const SAVINGS_PLAN: Record<EmergencyFund, { label: string; tone: "good" | "warn" | "bad" | "muted" }> = {
  SEVERAL_MONTHS: { label: "3–6 months covered", tone: "good" },
  SOME: { label: "Some savings", tone: "warn" },
  NOT_YET: { label: "None yet", tone: "bad" },
  NOT_SURE: { label: "Not sure", tone: "muted" },
};

export const DEBT_PLAN: Record<HighInterestDebt, { label: string; tone: "good" | "warn" | "bad" | "muted" }> = {
  NO: { label: "None", tone: "good" },
  YES: { label: "Yes", tone: "warn" },
  NOT_SURE: { label: "Not sure", tone: "muted" },
  PREFER_NOT_TO_SAY: { label: "Prefer not to say", tone: "muted" },
};

export const EXPERIENCE_PLAN: Record<InvestingExperience, string> = {
  COMPLETELY_NEW: "Beginner",
  KNOW_BASICS: "Knows the basics",
  ALREADY_INVESTING: "Already investing",
  COMFORTABLE_RESEARCHING: "Researches investments",
};

export const CADENCE_OPTIONS: { value: ReviewCadence; label: string }[] = [
  { value: "EVERY_SIX_MONTHS", label: "Every 6 months" },
  { value: "YEARLY", label: "Once a year" },
  { value: "ON_LIFE_CHANGE", label: "Only when life changes" },
];

export const ALLOCATION_BUCKETS: { key: keyof AllocationSnapshot; label: string; note: string }[] = [
  { key: "etfs", label: "Diversified ETFs", note: "Broad funds across many companies" },
  { key: "stocks", label: "Individual companies", note: "Businesses you research yourself" },
  { key: "bonds", label: "Bonds", note: "Lower expected return, lower swings" },
  { key: "cash", label: "Cash", note: "Kept aside, available" },
];

export const RULE_EXAMPLES = [
  "Maximum 5% in one company",
  "No leverage",
  "Research before buying an individual company",
  "Write a thesis before investing",
  "Don't sell only because the price falls",
];

export const emptyAllocation = (): AllocationSnapshot => ({ etfs: 0, stocks: 0, bonds: 0, cash: 0 });

export function allocationTotal(allocation: AllocationSnapshot | null) {
  if (!allocation) {
    return 0;
  }
  return allocation.etfs + allocation.stocks + allocation.bonds + allocation.cash;
}

export function formatPlanDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function nextReviewLabel(
  lastReviewed: string | null,
  cadence: ReviewCadence | null
): string {
  const resolved = cadence ?? "EVERY_SIX_MONTHS";
  if (resolved === "ON_LIFE_CHANGE") {
    return "When something changes";
  }
  if (!lastReviewed) {
    return "Not scheduled yet";
  }
  const date = new Date(lastReviewed);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled yet";
  }
  date.setMonth(date.getMonth() + (resolved === "YEARLY" ? 12 : 6));
  return formatPlanDate(date.toISOString()) ?? "Not scheduled yet";
}

export function planIsCurrent(lastReviewed: string | null, cadence: ReviewCadence | null) {
  if (!lastReviewed) {
    return false;
  }
  if ((cadence ?? "EVERY_SIX_MONTHS") === "ON_LIFE_CHANGE") {
    return true;
  }
  const date = new Date(lastReviewed);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  date.setMonth(date.getMonth() + ((cadence ?? "EVERY_SIX_MONTHS") === "YEARLY" ? 12 : 6));
  return date.getTime() >= Date.now();
}

export function planView(profile: OnboardingResponse) {
  const answers = answersFromResponse(profile);
  const labels = summaryLabels(answers);
  const lastReviewed = profile.updatedAt ?? profile.completedAt;

  return {
    answers,
    labels,
    goalTitle: answers.goal ? GOAL_SUMMARY[answers.goal] : "Your investing plan",
    goalBlurb: answers.goal ? GOAL_BLURB[answers.goal] : "A few answers from onboarding will appear here.",
    horizon: answers.timeHorizon ? HORIZON_SUMMARY[answers.timeHorizon] : "Not set yet",
    contribution: labels.contribution,
    contributionTarget: parsedAmount(answers)
      ? `€${answers.monthlyContribution} / ${answers.contributionPeriod === "QUARTER" ? "quarter" : answers.contributionPeriod === "YEAR" ? "year" : "month"}`
      : labels.contribution,
    experience: answers.experience ? EXPERIENCE_PLAN[answers.experience] : "Not set yet",
    experienceDetail: answers.experience ? EXP_SUMMARY[answers.experience] : "Not set yet",
    approach: answers.approach ? APPROACH_SUMMARY[answers.approach] : "Not set yet",
    savings: answers.emergencyFund ? SAVINGS_PLAN[answers.emergencyFund] : null,
    debt: answers.highInterestDebt ? DEBT_PLAN[answers.highInterestDebt] : null,
    showSavingsLesson: answers.emergencyFund != null && answers.emergencyFund !== "SEVERAL_MONTHS",
    allocation: answers.allocation,
    rules: answers.rules,
    lastReviewed: formatPlanDate(lastReviewed),
    nextReview: nextReviewLabel(lastReviewed, answers.reviewCadence),
    upToDate: planIsCurrent(lastReviewed, answers.reviewCadence),
    cadence: answers.reviewCadence,
  };
}

export function planSummaryLine(answers: OnboardingAnswers) {
  const labels = summaryLabels(answers);
  return `${labels.goal} · ${labels.horizon} · ${labels.contribution}`;
}

export function cadenceSummary(answers: OnboardingAnswers) {
  const cadence = answers.reviewCadence ?? "EVERY_SIX_MONTHS";
  const cadenceLabel =
    cadence === "YEARLY" ? "yearly" : cadence === "ON_LIFE_CHANGE" ? "on change" : "every 6 months";
  if (answers.rules.length === 0) {
    return `No rules yet · reviewed ${cadenceLabel}`;
  }
  return `${answers.rules.length} ${answers.rules.length === 1 ? "rule" : "rules"} · reviewed ${cadenceLabel}`;
}

export const TONE_COLOR = {
  good: "#56A177",
  warn: "#C79A4E",
  bad: "#C98484",
  muted: "#6F7680",
};
