import { api } from "@/lib/auth";

export type AssetType = "STOCK" | "ETF" | "FUND" | "OTHER";

export type CompanyQuote = {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
  week52Low: number | null;
  week52High: number | null;
  asOf: string | null;
};

export type CompanyFinancials = {
  period: string | null;
  asOf: string | null;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  peRatio: number | null;
  forwardPe: number | null;
  profitMargin: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
  dividendYieldPercent: number | null;
  freeCashFlow: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  cashAndInvestments: number | null;
  totalDebt: number | null;
  currentRatio: number | null;
};

export type AnnualFigure = {
  year: number;
  revenue: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
};

export type CompanyProfile = {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  currency: string | null;
  country: string | null;
  sector: string | null;
  industry: string | null;
  website: string | null;
  summary: string | null;
  employees: number | null;
  ceo: string | null;
  ipoDate: string | null;
  quote: CompanyQuote | null;
  financials: CompanyFinancials | null;
  annuals: AnnualFigure[];
};

export type PricePoint = {
  date: string;
  close: number;
};

export type StatementPeriod = "ANNUAL" | "QUARTERLY";

export type IncomeStatement = {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  researchAndDevelopment: number | null;
  sellingGeneralAndAdmin: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  interestAndOther: number | null;
  incomeBeforeTax: number | null;
  incomeTax: number | null;
  netIncome: number | null;
  eps: number | null;
  epsDiluted: number | null;
  ebitda: number | null;
  depreciationAndAmortization: number | null;
  dilutedShares: number | null;
};

export type BalanceSheet = {
  cash: number | null;
  shortTermInvestments: number | null;
  cashAndInvestments: number | null;
  totalCurrentAssets: number | null;
  longTermInvestments: number | null;
  totalAssets: number | null;
  shortTermDebt: number | null;
  longTermDebt: number | null;
  totalDebt: number | null;
  totalCurrentLiabilities: number | null;
  totalLiabilities: number | null;
  equity: number | null;
};

export type CashFlowStatement = {
  operatingCashFlow: number | null;
  depreciationAndAmortization: number | null;
  stockBasedCompensation: number | null;
  capex: number | null;
  freeCashFlow: number | null;
  dividendsPaid: number | null;
  shareRepurchases: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  netChangeInCash: number | null;
};

export type StatementLine = {
  date: string;
  fiscalPeriod: string | null;
  fiscalYear: number | null;
  label: string;
  shortLabel: string | null;
  income: IncomeStatement;
  balance: BalanceSheet;
  cashFlow: CashFlowStatement;
};

export type CompanyStatements = {
  symbol: string;
  currency: string | null;
  period: StatementPeriod;
  lines: StatementLine[];
};

export type InstrumentMatch = {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  currency: string | null;
};

export function instrumentPath(symbol: string) {
  return `/company/${encodeURIComponent(symbol.trim().toUpperCase())}`;
}

export function instrumentFinancialsPath(symbol: string) {
  return `${instrumentPath(symbol)}/financials`;
}

export function instrumentValuationPath(symbol: string) {
  return `${instrumentPath(symbol)}/valuation`;
}

export function instrumentResearchPath(symbol: string) {
  return `${instrumentPath(symbol)}/research`;
}

export function instrumentThesisPath(symbol: string) {
  return `${instrumentPath(symbol)}/thesis`;
}

export function instrumentFullFinancialsPath(symbol: string) {
  return `${instrumentFinancialsPath(symbol)}/full`;
}

export async function getInstrument(symbol: string) {
  return api<CompanyProfile>(`/api/instruments/${encodeURIComponent(symbol)}`);
}

export async function getInstrumentPrices(symbol: string) {
  return api<PricePoint[]>(`/api/instruments/${encodeURIComponent(symbol)}/prices`);
}

export async function getCompanyStatements(symbol: string, period: StatementPeriod = "ANNUAL", signal?: AbortSignal) {
  const filing = period === "QUARTERLY" ? "quarterly" : "annual";
  return api<CompanyStatements>(`/api/instruments/${encodeURIComponent(symbol)}/statements?period=${filing}`, { signal });
}

export async function searchInstruments(query: string, signal?: AbortSignal) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  return api<InstrumentMatch[]>(`/api/instruments?q=${encodeURIComponent(q)}`, { signal });
}

export function looksLikeTicker(value: string) {
  const q = value.trim();
  if (!q || q.includes(" ")) {
    return false;
  }
  return /^[A-Za-z0-9][A-Za-z0-9.\-]{0,11}$/.test(q);
}

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  STOCK: "Company",
  ETF: "ETF",
  FUND: "Fund",
  OTHER: "Instrument",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  USA: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  FR: "France",
  DE: "Germany",
  NL: "Netherlands",
  IE: "Ireland",
  JP: "Japan",
  CN: "China",
  CA: "Canada",
  CH: "Switzerland",
};

export function countryName(code: string | null | undefined) {
  if (!code) {
    return null;
  }
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

export function websiteHost(url: string | null | undefined) {
  if (!url) {
    return null;
  }
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatCompactMoney(value: number | null | undefined, currency = "USD") {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }
}

export function formatPrice(value: number | null | undefined, currency = "USD") {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value >= 100 ? 2 : 4,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function formatRatioPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

export function formatGrowthPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const percent = Math.abs(value) <= 2 ? value * 100 : value;
  const formatted = `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
  return formatted;
}

export function formatChangePercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const percent = Math.abs(value) <= 1 && Math.abs(value) > 0 ? value * 100 : value;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
}

export function formatSignedMoney(value: number | null | undefined, currency = "USD") {
  const formatted = formatPrice(value == null ? null : Math.abs(value), currency);
  if (!formatted || value == null) {
    return null;
  }
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

export function formatEmployees(value: number | null | undefined) {
  if (value == null) {
    return null;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatYieldPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value <= 0) {
    return null;
  }
  const percent = value > 0 && value <= 1 ? value * 100 : value;
  return `${percent.toFixed(2)}%`;
}

export function shortSummary(text: string, max = 360) {
  if (text.length <= max) {
    return text;
  }
  const slice = text.slice(0, max);
  const sentence = slice.lastIndexOf(". ");
  if (sentence > 140) {
    return slice.slice(0, sentence + 1);
  }
  return `${slice.trimEnd()}…`;
}
