import {
  answersFromResponse,
  parsedAmount,
  summaryLabels,
  type InvestmentKnowledge,
  type OnboardingAnswers,
  type OnboardingResponse,
} from "@/lib/onboarding";

export type HomeLesson = {
  title: string;
  body: string;
  topic: InvestmentKnowledge;
};

export type HomeModel = {
  plan: { value: string; meta: string } | null;
  contribution: { value: string; meta: string } | null;
  lessons: HomeLesson[];
};

const FOUNDATION_LESSONS: HomeLesson[] = [
  {
    topic: "RISK_AND_RETURN",
    title: "Risk & return",
    body: "Understand why investments move and what risk really means.",
  },
  {
    topic: "DIVERSIFICATION",
    title: "Diversification",
    body: "Learn why spreading your investments can reduce certain risks.",
  },
  {
    topic: "ETFS",
    title: "What is an ETF?",
    body: "Understand one of the simplest ways to own many investments at once.",
  },
];

const NEXT_LESSONS: HomeLesson[] = [
  {
    topic: "INVESTMENT_THESIS",
    title: "Investment thesis",
    body: "Learn how to write why you would invest, and what would make you change your mind.",
  },
  {
    topic: "VALUATION",
    title: "Valuation",
    body: "Understand how investors think about what a company is worth.",
  },
];

export function homeModel(profile: OnboardingResponse): HomeModel {
  const answers = answersFromResponse(profile);
  const labels = summaryLabels(answers);

  return {
    plan: planCard(profile, labels.goal, labels.horizon),
    contribution: contributionCard(answers, labels.contribution),
    lessons: recommendedLessons(answers),
  };
}

function planCard(profile: OnboardingResponse, goal: string, horizon: string) {
  if (!profile.completed && !profile.goal && !profile.timeHorizon) {
    return null;
  }

  return {
    value: writtenLabel(profile.completedAt, profile.completed),
    meta: [goal !== "Not defined yet" ? goal : null, horizon !== "Not defined yet" ? horizon : null]
      .filter(Boolean)
      .join(" · "),
  };
}

function contributionCard(answers: OnboardingAnswers, contribution: string) {
  if (!answers.contributionPlan) {
    return null;
  }

  const amount = parsedAmount(answers);
  if (answers.contributionPlan === "REGULARLY" && amount != null) {
    return {
      value: `€${answers.monthlyContribution}`,
      meta: `per ${periodWord(answers.contributionPeriod)} · your target`,
    };
  }

  return {
    value: contribution,
    meta: "No amount set yet",
  };
}

function recommendedLessons(answers: OnboardingAnswers): HomeLesson[] {
  const known = new Set(answers.knowledge.includes("NOT_SURE") ? [] : answers.knowledge);
  const remaining = FOUNDATION_LESSONS.filter((lesson) => !known.has(lesson.topic));
  if (remaining.length > 0) {
    return remaining;
  }

  return NEXT_LESSONS.filter((lesson) => !known.has(lesson.topic)).slice(0, 3);
}

function writtenLabel(completedAt: string | null, completed: boolean) {
  if (!completed) {
    return "In progress";
  }
  if (!completedAt) {
    return "Written";
  }

  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) {
    return "Written";
  }

  const now = new Date();
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "Written today";
  }

  return `Written ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date)}`;
}

function periodWord(period: OnboardingAnswers["contributionPeriod"]) {
  if (period === "QUARTER") {
    return "quarter";
  }
  if (period === "YEAR") {
    return "year";
  }
  return "month";
}
