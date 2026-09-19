import { api } from "@/lib/auth";

export type InvestmentGoal =
  | "BUILD_WEALTH"
  | "FUTURE_PURCHASE"
  | "ADDITIONAL_INCOME"
  | "PRESERVE_SAVINGS"
  | "STILL_FIGURING_OUT";

export type TimeHorizon =
  | "LESS_THAN_3_YEARS"
  | "THREE_TO_FIVE_YEARS"
  | "FIVE_TO_TEN_YEARS"
  | "TEN_TO_TWENTY_YEARS"
  | "TWENTY_PLUS_YEARS"
  | "NOT_SURE";

export type EmergencyFund = "SEVERAL_MONTHS" | "SOME" | "NOT_YET" | "NOT_SURE";
export type HighInterestDebt = "NO" | "YES" | "NOT_SURE" | "PREFER_NOT_TO_SAY";
export type ContributionPlan = "REGULARLY" | "OCCASIONALLY" | "ONE_LARGER_AMOUNT" | "DONT_KNOW_YET";
export type ContributionPeriod = "MONTH" | "QUARTER" | "YEAR";
export type RiskReaction =
  | "WANT_TO_SELL"
  | "UNCOMFORTABLE_WAIT"
  | "REVIEW_REASONS"
  | "COMFORTABLE_HOLD"
  | "DONT_KNOW";
export type InvestingExperience =
  | "COMPLETELY_NEW"
  | "KNOW_BASICS"
  | "ALREADY_INVESTING"
  | "COMFORTABLE_RESEARCHING";
export type InvestmentKnowledge =
  | "STOCKS"
  | "ETFS"
  | "RISK_AND_RETURN"
  | "DIVERSIFICATION"
  | "COMPOUND_INTEREST"
  | "FINANCIAL_STATEMENTS"
  | "VALUATION"
  | "INVESTMENT_THESIS"
  | "NOT_SURE";
export type InvestingApproach =
  | "SIMPLE_ETFS"
  | "MIX_ETFS_AND_STOCKS"
  | "RESEARCH_COMPANIES"
  | "NOT_SURE";

export type OnboardingAnswers = {
  goal: InvestmentGoal | null;
  timeHorizon: TimeHorizon | null;
  emergencyFund: EmergencyFund | null;
  highInterestDebt: HighInterestDebt | null;
  contributionPlan: ContributionPlan | null;
  monthlyContribution: string;
  contributionPeriod: ContributionPeriod;
  amountSkipped: boolean;
  riskReaction: RiskReaction | null;
  experience: InvestingExperience | null;
  knowledge: InvestmentKnowledge[];
  approach: InvestingApproach | null;
};

export type OnboardingResponse = {
  goal: InvestmentGoal | null;
  timeHorizon: TimeHorizon | null;
  emergencyFund: EmergencyFund | null;
  highInterestDebt: HighInterestDebt | null;
  contributionPlan: ContributionPlan | null;
  monthlyContribution: number | string | null;
  contributionPeriod: ContributionPeriod | null;
  riskReaction: RiskReaction | null;
  experience: InvestingExperience | null;
  knowledge: InvestmentKnowledge[] | null;
  approach: InvestingApproach | null;
  completed: boolean;
  completedAt: string | null;
};

export const QUESTION_COUNT = 7;

export const emptyAnswers = (): OnboardingAnswers => ({
  goal: null,
  timeHorizon: null,
  emergencyFund: null,
  highInterestDebt: null,
  contributionPlan: null,
  monthlyContribution: "300",
  contributionPeriod: "MONTH",
  amountSkipped: false,
  riskReaction: null,
  experience: null,
  knowledge: [],
  approach: null,
});

export function answersFromResponse(profile: OnboardingResponse): OnboardingAnswers {
  const amount =
    profile.monthlyContribution == null ? "300" : String(profile.monthlyContribution).replace(/\.00$/, "");
  return {
    goal: profile.goal,
    timeHorizon: profile.timeHorizon,
    emergencyFund: profile.emergencyFund,
    highInterestDebt: profile.highInterestDebt,
    contributionPlan: profile.contributionPlan,
    monthlyContribution: amount,
    contributionPeriod: profile.contributionPeriod ?? "MONTH",
    amountSkipped: profile.contributionPlan === "REGULARLY" && profile.monthlyContribution == null,
    riskReaction: profile.riskReaction,
    experience: profile.experience,
    knowledge: profile.knowledge ?? [],
    approach: profile.approach,
  };
}

export function resumeStep(answers: OnboardingAnswers, completed: boolean) {
  if (completed) {
    return 8;
  }
  if (!answers.goal) {
    return 0;
  }
  if (!answers.timeHorizon) {
    return 2;
  }
  if (!answers.emergencyFund || !answers.highInterestDebt) {
    return 3;
  }
  if (!answers.contributionPlan) {
    return 4;
  }
  if (!answers.riskReaction) {
    return 5;
  }
  if (!answers.experience) {
    return 6;
  }
  if (!answers.approach) {
    return 7;
  }
  return 8;
}

export function canContinue(step: number, answers: OnboardingAnswers) {
  switch (step) {
    case 0:
      return true;
    case 1:
      return Boolean(answers.goal);
    case 2:
      return Boolean(answers.timeHorizon);
    case 3:
      return Boolean(answers.emergencyFund && answers.highInterestDebt);
    case 4:
      return Boolean(answers.contributionPlan);
    case 5:
      return Boolean(answers.riskReaction);
    case 6:
      return Boolean(answers.experience);
    case 7:
      return Boolean(answers.approach);
    default:
      return false;
  }
}

export function parsedAmount(answers: OnboardingAnswers) {
  if (answers.contributionPlan !== "REGULARLY" || answers.amountSkipped) {
    return null;
  }
  const value = Number(answers.monthlyContribution);
  return Number.isFinite(value) && value >= 1 ? value : null;
}

export function toRequest(answers: OnboardingAnswers) {
  return {
    goal: answers.goal,
    timeHorizon: answers.timeHorizon,
    emergencyFund: answers.emergencyFund,
    highInterestDebt: answers.highInterestDebt,
    contributionPlan: answers.contributionPlan,
    monthlyContribution: parsedAmount(answers),
    contributionPeriod: answers.contributionPlan === "REGULARLY" ? answers.contributionPeriod : null,
    riskReaction: answers.riskReaction,
    experience: answers.experience,
    knowledge: answers.knowledge,
    approach: answers.approach,
  };
}

export async function getOnboarding() {
  return api<OnboardingResponse>("/api/onboarding");
}

export async function saveOnboarding(answers: OnboardingAnswers) {
  return api<OnboardingResponse>("/api/onboarding", {
    method: "PUT",
    body: JSON.stringify(toRequest(answers)),
  });
}

export function toggleKnowledge(
  current: InvestmentKnowledge[],
  topic: InvestmentKnowledge
): InvestmentKnowledge[] {
  if (topic === "NOT_SURE") {
    return current.includes("NOT_SURE") ? [] : ["NOT_SURE"];
  }
  const withoutUnsure = current.filter((item) => item !== "NOT_SURE");
  return withoutUnsure.includes(topic)
    ? withoutUnsure.filter((item) => item !== topic)
    : [...withoutUnsure, topic];
}

export const GOAL_OPTIONS: { value: InvestmentGoal; title: string; subtitle: string }[] = [
  { value: "BUILD_WEALTH", title: "Build wealth over the long term", subtitle: "Grow my money over many years." },
  {
    value: "FUTURE_PURCHASE",
    title: "Prepare for a future purchase",
    subtitle: "For example, a home or another important project.",
  },
  {
    value: "ADDITIONAL_INCOME",
    title: "Generate additional income",
    subtitle: "Build investments that may provide income over time.",
  },
  { value: "PRESERVE_SAVINGS", title: "Preserve my savings", subtitle: "Focus on protecting purchasing power." },
  { value: "STILL_FIGURING_OUT", title: "I'm still figuring it out", subtitle: "I want to understand my options first." },
];

export const HORIZON_OPTIONS: { value: TimeHorizon; label: string; muted?: boolean }[] = [
  { value: "LESS_THAN_3_YEARS", label: "Less than 3 years" },
  { value: "THREE_TO_FIVE_YEARS", label: "3–5 years" },
  { value: "FIVE_TO_TEN_YEARS", label: "5–10 years" },
  { value: "TEN_TO_TWENTY_YEARS", label: "10–20 years" },
  { value: "TWENTY_PLUS_YEARS", label: "20+ years" },
  { value: "NOT_SURE", label: "I'm not sure", muted: true },
];

export const SAVINGS_OPTIONS: { value: EmergencyFund; label: string; muted?: boolean }[] = [
  { value: "SEVERAL_MONTHS", label: "Yes, enough for several months" },
  { value: "SOME", label: "I have some" },
  { value: "NOT_YET", label: "Not yet" },
  { value: "NOT_SURE", label: "I'm not sure what that means", muted: true },
];

export const DEBT_OPTIONS: { value: HighInterestDebt; label: string; muted?: boolean }[] = [
  { value: "NO", label: "No" },
  { value: "YES", label: "Yes" },
  { value: "NOT_SURE", label: "I'm not sure", muted: true },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say", muted: true },
];

export const CONTRIB_OPTIONS: { value: ContributionPlan; title: string; subtitle: string }[] = [
  { value: "REGULARLY", title: "Regularly", subtitle: "Invest a similar amount over time." },
  { value: "OCCASIONALLY", title: "Occasionally", subtitle: "Invest whenever I have money available." },
  { value: "ONE_LARGER_AMOUNT", title: "One larger amount", subtitle: "I currently have money I'd like to invest." },
  { value: "DONT_KNOW_YET", title: "I don't know yet", subtitle: "Help me understand the options." },
];

export const PERIOD_OPTIONS: { value: ContributionPeriod; label: string }[] = [
  { value: "MONTH", label: "per month" },
  { value: "QUARTER", label: "per quarter" },
  { value: "YEAR", label: "per year" },
];

export const RISK_OPTIONS: { value: RiskReaction; title: string; subtitle: string }[] = [
  { value: "WANT_TO_SELL", title: "I'd probably want to sell", subtitle: "Seeing that loss would make me very uncomfortable." },
  {
    value: "UNCOMFORTABLE_WAIT",
    title: "I'd be uncomfortable, but I'd wait",
    subtitle: "I'd prefer not to make an immediate decision.",
  },
  {
    value: "REVIEW_REASONS",
    title: "I'd review why I invested",
    subtitle: "I'd check whether my original reasons still make sense.",
  },
  {
    value: "COMFORTABLE_HOLD",
    title: "I'd be comfortable holding",
    subtitle: "If my reasons still make sense, short-term losses wouldn't worry me too much.",
  },
  { value: "DONT_KNOW", title: "I honestly don't know", subtitle: "I've never experienced something like this." },
];

export const EXPERIENCE_OPTIONS: { value: InvestingExperience; title: string; subtitle: string }[] = [
  { value: "COMPLETELY_NEW", title: "I'm completely new", subtitle: "I'm starting from the beginning." },
  { value: "KNOW_BASICS", title: "I know the basics", subtitle: "I understand some common investing concepts." },
  { value: "ALREADY_INVESTING", title: "I've already started investing", subtitle: "I own or have owned investments." },
  {
    value: "COMFORTABLE_RESEARCHING",
    title: "I'm comfortable researching investments",
    subtitle: "I already analyze companies or funds myself.",
  },
];

export const KNOWLEDGE_OPTIONS: { value: InvestmentKnowledge; label: string; muted?: boolean }[] = [
  { value: "STOCKS", label: "Stocks" },
  { value: "ETFS", label: "ETFs" },
  { value: "RISK_AND_RETURN", label: "Risk & return" },
  { value: "DIVERSIFICATION", label: "Diversification" },
  { value: "COMPOUND_INTEREST", label: "Compound interest" },
  { value: "FINANCIAL_STATEMENTS", label: "Financial statements" },
  { value: "VALUATION", label: "Valuation" },
  { value: "INVESTMENT_THESIS", label: "Investment thesis" },
  { value: "NOT_SURE", label: "I'm not sure", muted: true },
];

export const APPROACH_OPTIONS: { value: InvestingApproach; title: string; subtitle: string }[] = [
  { value: "SIMPLE_ETFS", title: "Keep it simple", subtitle: "I mainly want diversified funds or ETFs." },
  {
    value: "MIX_ETFS_AND_STOCKS",
    title: "Mix simplicity and research",
    subtitle: "I want a diversified foundation and also research some companies myself.",
  },
  {
    value: "RESEARCH_COMPANIES",
    title: "Research companies myself",
    subtitle: "I enjoy understanding businesses and forming my own investment ideas.",
  },
  { value: "NOT_SURE", title: "I'm not sure yet", subtitle: "I want to learn the differences before deciding." },
];

const GOAL_SUMMARY: Record<InvestmentGoal, string> = {
  BUILD_WEALTH: "Build wealth over the long term",
  FUTURE_PURCHASE: "Prepare for a future purchase",
  ADDITIONAL_INCOME: "Generate additional income",
  PRESERVE_SAVINGS: "Preserve my savings",
  STILL_FIGURING_OUT: "Still figuring it out",
};

const HORIZON_SUMMARY: Record<TimeHorizon, string> = {
  LESS_THAN_3_YEARS: "Less than 3 years",
  THREE_TO_FIVE_YEARS: "3–5 years",
  FIVE_TO_TEN_YEARS: "5–10 years",
  TEN_TO_TWENTY_YEARS: "10–20 years",
  TWENTY_PLUS_YEARS: "20+ years",
  NOT_SURE: "Not sure yet",
};

const CONTRIB_SUMMARY: Record<ContributionPlan, string> = {
  REGULARLY: "Regularly",
  OCCASIONALLY: "Occasionally",
  ONE_LARGER_AMOUNT: "One larger amount",
  DONT_KNOW_YET: "Not decided yet",
};

const PERIOD_SUMMARY: Record<ContributionPeriod, string> = {
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
};

const EXP_SUMMARY: Record<InvestingExperience, string> = {
  COMPLETELY_NEW: "Complete beginner",
  KNOW_BASICS: "Knows the basics",
  ALREADY_INVESTING: "Already investing",
  COMFORTABLE_RESEARCHING: "Comfortable researching",
};

const APPROACH_SUMMARY: Record<InvestingApproach, string> = {
  SIMPLE_ETFS: "Diversified funds and ETFs",
  MIX_ETFS_AND_STOCKS: "ETFs + individual companies",
  RESEARCH_COMPANIES: "Researches companies",
  NOT_SURE: "Undecided — learning first",
};

export function summaryLabels(answers: OnboardingAnswers) {
  const contribution =
    answers.contributionPlan === "REGULARLY" && !answers.amountSkipped && parsedAmount(answers) != null
      ? `€${answers.monthlyContribution} / ${PERIOD_SUMMARY[answers.contributionPeriod]}`
      : answers.contributionPlan
        ? CONTRIB_SUMMARY[answers.contributionPlan]
        : "Not defined yet";

  return {
    goal: answers.goal ? GOAL_SUMMARY[answers.goal] : "Not defined yet",
    horizon: answers.timeHorizon ? HORIZON_SUMMARY[answers.timeHorizon] : "Not defined yet",
    contribution,
    experience: answers.experience ? EXP_SUMMARY[answers.experience] : "Not defined yet",
    approach: answers.approach ? APPROACH_SUMMARY[answers.approach] : "Not defined yet",
  };
}
