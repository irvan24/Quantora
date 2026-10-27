import type { InvestmentKnowledge } from "@/lib/onboarding";

export type { InvestmentKnowledge };

export type LessonTopic = Exclude<InvestmentKnowledge, "NOT_SURE">;

export type LessonSection = {
  heading: string;
  paragraphs: string[];
};

export type Lesson = {
  topic: LessonTopic;
  title: string;
  subtitle: string;
  durationMinutes: number;
  sections: LessonSection[];
  takeaway: string;
};

const LESSONS: Record<LessonTopic, Lesson> = {
  RISK_AND_RETURN: {
    topic: "RISK_AND_RETURN",
    title: "Risk & return",
    subtitle: "Why investments move, and what “risk” really means for you.",
    durationMinutes: 4,
    sections: [
      {
        heading: "Return is what you hope to earn",
        paragraphs: [
          "When people talk about return, they mean how much an investment grows (or shrinks) over time — often shown as a yearly percentage.",
          "There is no free lunch: higher long-term return usually comes with a wider range of outcomes. Some years feel great; some years feel awful.",
        ],
      },
      {
        heading: "Risk is the range of outcomes",
        paragraphs: [
          "Risk is not just “losing everything.” It is how far results can swing away from what you expected — including sitting below your goal for years.",
          "Volatility (prices moving up and down) is uncomfortable, but it is not the same as a permanent loss. A permanent loss happens when the underlying business fails or you sell at the worst moment because you could not stick to your plan.",
        ],
      },
      {
        heading: "Time horizon changes the picture",
        paragraphs: [
          "Money you need within a few years should not ride the same roller coaster as money you will not touch for decades.",
          "Your onboarding plan already captured a horizon. Use it: short horizons favour stability; long horizons can tolerate more growth assets if you can stay disciplined.",
        ],
      },
    ],
    takeaway: "Return and risk move together. Your job is to choose a level of swing you can live with for your time horizon — then write rules so you do not panic-sell.",
  },
  DIVERSIFICATION: {
    topic: "DIVERSIFICATION",
    title: "Diversification",
    subtitle: "Spreading investments so one bad outcome does not define you.",
    durationMinutes: 4,
    sections: [
      {
        heading: "Do not bet everything on one story",
        paragraphs: [
          "Diversification means owning many different drivers of return — regions, industries, asset types — so no single event wipes out your progress.",
          "It does not guarantee profit. It reduces the chance that one company, one country, or one theme ruins your plan.",
        ],
      },
      {
        heading: "Correlation matters",
        paragraphs: [
          "Assets that always move together are not really diversified. The point is to combine things that do not fail on the same day.",
          "Cash and high-quality bonds often cushion stock crashes; stocks often outgrow inflation over long periods. Your allocation in My Plan is a diversification choice.",
        ],
      },
      {
        heading: "Simple can be enough",
        paragraphs: [
          "A small number of broad funds can diversify more than dozens of single stocks picked without research.",
          "Diversification is a tool for discipline — not a reason to buy everything you hear about.",
        ],
      },
    ],
    takeaway: "Spread risk across independent drivers of return. Match breadth to how much time and attention you want to spend.",
  },
  ETFS: {
    topic: "ETFS",
    title: "What is an ETF?",
    subtitle: "A simple way to own many investments in one package.",
    durationMinutes: 5,
    sections: [
      {
        heading: "A basket you can buy like a stock",
        paragraphs: [
          "An ETF (exchange-traded fund) holds a bundle of assets — often hundreds of stocks or bonds — and you buy shares of the fund on an exchange.",
          "One purchase can give you exposure to an entire market or theme, which is why many beginners start here.",
        ],
      },
      {
        heading: "Fees and tracking",
        paragraphs: [
          "ETFs charge an annual fee (expense ratio), usually lower than many active funds. Over decades, fees matter.",
          "An index ETF tries to follow an index (e.g. a broad market). It will not match perfectly because of fees and how trades are executed — small gaps are normal.",
        ],
      },
      {
        heading: "ETFs are not risk-free",
        paragraphs: [
          "A broad stock ETF can still drop sharply in a crash. A sector ETF can be concentrated. Read what the fund actually holds before it becomes part of your plan.",
          "ETFs fit many approaches in Quantora — especially “simple ETFs” or a mix with individual research later.",
        ],
      },
    ],
    takeaway: "ETFs are tools for broad, low-friction diversification. Choose funds that match your plan, then stick to the rules you wrote.",
  },
  STOCKS: {
    topic: "STOCKS",
    title: "Stocks",
    subtitle: "Owning a slice of a business — and its future.",
    durationMinutes: 4,
    sections: [
      {
        heading: "A share is a claim on outcomes",
        paragraphs: [
          "A stock represents partial ownership in a company. If the business grows profits over time, owners may benefit through price appreciation and sometimes dividends.",
          "Prices also move on emotion, news, and macro events — often faster than the business itself changes.",
        ],
      },
      {
        heading: "Why single stocks are harder",
        paragraphs: [
          "Individual companies can fail, disrupt themselves, or simply disappoint for years. That is why concentrated stock picking requires a thesis and ongoing review.",
          "Quantora’s research flow exists to slow you down: understand, assume, stress-test, then decide.",
        ],
      },
    ],
    takeaway: "Stocks are ownership, not lottery tickets. If you pick them, document why and what would change your mind.",
  },
  COMPOUND_INTEREST: {
    topic: "COMPOUND_INTEREST",
    title: "Compound growth",
    subtitle: "How time and reinvestment amplify results.",
    durationMinutes: 3,
    sections: [
      {
        heading: "Growth on growth",
        paragraphs: [
          "Compounding means your gains can themselves earn returns. Over long horizons, that snowball effect dominates outcomes more than picking the perfect month to start.",
          "Regular contributions from your plan add fuel — even small amounts matter when the horizon is long.",
        ],
      },
    ],
    takeaway: "Time in the market plus consistent contributions beats perfect timing — if you stay invested.",
  },
  FINANCIAL_STATEMENTS: {
    topic: "FINANCIAL_STATEMENTS",
    title: "Financial statements",
    subtitle: "The numbers companies report — and what to look for first.",
    durationMinutes: 5,
    sections: [
      {
        heading: "Three core reports",
        paragraphs: [
          "Income statement: revenues and profits over a period. Balance sheet: what the company owns and owes at a point in time. Cash flow: actual cash moving in and out.",
          "Profit on paper can differ from cash reality. Cash flow often tells the harder truth.",
        ],
      },
    ],
    takeaway: "Start with cash and debt, not headlines. Statements support your thesis — they do not replace it.",
  },
  VALUATION: {
    topic: "VALUATION",
    title: "Valuation",
    subtitle: "What investors pay today for future outcomes.",
    durationMinutes: 5,
    sections: [
      {
        heading: "Price vs value",
        paragraphs: [
          "Market price is what people pay right now. Value is your estimate of what the business is worth based on assumptions about the future.",
          "There is no single correct number — only ranges and stories that must stay plausible.",
        ],
      },
    ],
    takeaway: "Valuation forces you to write assumptions. If you cannot explain them, you are guessing.",
  },
  INVESTMENT_THESIS: {
    topic: "INVESTMENT_THESIS",
    title: "Investment thesis",
    subtitle: "Why you would invest — and what would make you stop.",
    durationMinutes: 5,
    sections: [
      {
        heading: "A thesis is a decision in writing",
        paragraphs: [
          "It states what must stay true for you to remain invested: growth drivers, risks you accept, and metrics you will revisit.",
          "Without invalidation criteria, every dip feels like a reason to panic or double down blindly.",
        ],
      },
      {
        heading: "Quantora’s next step",
        paragraphs: [
          "After lessons, write your first thesis in Theses. Home’s “Discipline” score will wake up once you do.",
        ],
      },
    ],
    takeaway: "Invest on purpose. Write what would change your mind before the market tests you.",
  },
};

export const FOUNDATION_TOPICS: LessonTopic[] = ["RISK_AND_RETURN", "DIVERSIFICATION", "ETFS"];

export function getLesson(topic: string): Lesson | null {
  if (topic in LESSONS) {
    return LESSONS[topic as LessonTopic];
  }
  return null;
}

export function listLessons(topics: LessonTopic[]): Lesson[] {
  return topics.map((topic) => LESSONS[topic]);
}

export function lessonPath(topic: LessonTopic) {
  return `/learn/${topic}`;
}

export function asLessonTopic(topic: InvestmentKnowledge): LessonTopic | null {
  if (topic === "NOT_SURE" || !(topic in LESSONS)) {
    return null;
  }
  return topic as LessonTopic;
}

const PROGRESS_KEY = "quantora.learn.completed";

export function readCompletedLessons(): Set<LessonTopic> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((t): t is LessonTopic => t in LESSONS));
  } catch {
    return new Set();
  }
}

export function markLessonCompleted(topic: LessonTopic) {
  const set = readCompletedLessons();
  set.add(topic);
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
}

export function isLessonCompleted(topic: LessonTopic) {
  return readCompletedLessons().has(topic);
}
