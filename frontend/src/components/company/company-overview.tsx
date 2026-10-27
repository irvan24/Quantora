"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CompanyIdentity } from "@/components/company/company-identity";
import { PriceChart } from "@/components/company/price-chart";
import {
  countryName,
  formatCompactMoney,
  formatEmployees,
  formatGrowthPercent,
  formatNumber,
  formatPrice,
  formatRatioPercent,
  formatYieldPercent,
  getInstrument,
  getInstrumentPrices,
  instrumentPath,
  instrumentResearchPath,
  shortSummary,
  websiteHost,
  type CompanyProfile,
  type PricePoint,
} from "@/lib/instruments";

export function CompanyOverview({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCompany(null);
    setPrices([]);
    (async () => {
      try {
        const data = await getInstrument(symbol);
        if (cancelled) {
          return;
        }
        if (data.symbol && data.symbol.toUpperCase() !== symbol.trim().toUpperCase()) {
          router.replace(instrumentPath(data.symbol));
        }
        setCompany(data);
        const series = await getInstrumentPrices(data.symbol).catch(() => []);
        if (!cancelled) {
          setPrices(series);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this company.");
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
  }, [symbol]);

  if (loading) {
    return <div className="min-h-[50vh]" />;
  }

  if (error || !company) {
    return (
      <div className="px-4 py-10 sm:px-10 sm:py-14">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Company not found</h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
          {error ?? "We could not find that company."} Search the company name and pick the main listing.
        </p>
      </div>
    );
  }

  const currency = company.currency ?? "USD";
  const quote = company.quote;
  const financials = company.financials;
  const displayName = company.name.replace(/\s+Inc\.?$/i, "").trim() || company.name;
  const about = company.summary ? shortSummary(company.summary) : null;
  const range = quote?.week52Low != null && quote.week52High != null ? quote : null;
  const rangePct =
    range && quote?.price != null && range.week52High !== range.week52Low
      ? Math.min(100, Math.max(0, ((quote.price - range.week52Low!) / (range.week52High! - range.week52Low!)) * 100))
      : null;

  const metrics = [
    { value: formatCompactMoney(quote?.marketCap, currency), label: "Market cap", hint: "Total value of all shares" },
    { value: financials?.peRatio != null ? formatNumber(financials.peRatio, 1) : null, label: "P/E ratio", hint: "Price per $1 of yearly profit" },
    { value: financials?.forwardPe != null ? formatNumber(financials.forwardPe, 1) : null, label: "Forward P/E", hint: "Based on expected profit" },
    {
      value: financials?.eps != null ? formatPrice(financials.eps, currency) : null,
      label: "EPS",
      hint: "Profit earned per share",
    },
    { value: formatCompactMoney(financials?.revenue, currency), label: "Revenue", hint: null },
    { value: formatCompactMoney(financials?.freeCashFlow, currency), label: "Free cash flow", hint: "Cash left after investments" },
    { value: formatYieldPercent(financials?.dividendYieldPercent), label: "Dividend yield", hint: null },
  ];

  const facts = [
    { label: "CEO", value: company.ceo },
    { label: "Sector", value: company.sector },
    { label: "Industry", value: company.industry },
    { label: "Country", value: countryName(company.country) },
    { label: "Employees", value: formatEmployees(company.employees) },
    { label: "Exchange", value: company.exchange },
  ].filter((fact) => fact.value);

  const bars = annualBars(company.annuals, currency);
  const cash = financials?.cashAndInvestments;
  const debt = financials?.totalDebt;

  return (
    <div className="flex w-full max-w-[1320px] flex-col gap-7 px-4 pb-12 pt-3 sm:px-10">
      <CompanyIdentity company={company} tab="overview" />

      <div className="flex flex-wrap items-stretch gap-5">
        {prices.length > 1 ? <PriceChart points={prices} currency={currency} /> : null}
        <section id="key-metrics" className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl bg-card px-[26px] pt-[22px] pb-5">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-[15px] font-semibold text-[#ECECE8]">Key metrics</h3>
            <span className="ml-auto text-xs text-[#6C727B]">TTM</span>
          </div>
          <div className="mt-3 grid flex-1 grid-cols-2">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`py-3.5 ${index % 2 === 0 ? "pr-3.5" : "border-l border-[#191C20] pl-4"} ${index < metrics.length - 2 ? "border-b border-[#191C20]" : ""}`}
              >
                <div className="text-[21px] font-normal tracking-[-0.01em] text-[#ECECE8]">{metric.value ?? "—"}</div>
                <div className="mt-1 text-[12.5px] text-[#7C828B]">{metric.label}</div>
                {metric.hint ? <div className="mt-1 text-[11.5px] leading-snug text-[#5E646D]">{metric.hint}</div> : null}
              </div>
            ))}
            {range ? (
              <div className="border-l border-[#191C20] py-3.5 pl-4">
                <div className="pt-1 text-[15px] font-normal text-[#ECECE8]">
                  {formatPrice(range.week52Low, currency)} — {formatPrice(range.week52High, currency)}
                </div>
                <div className="relative mt-2 h-[3px] rounded-sm bg-[#1E2228]">
                  <div className="absolute top-[-3px] h-[9px] w-0.5 rounded-sm bg-[#BDC3CB]" style={{ left: `${rangePct ?? 50}%` }} />
                </div>
                <div className="mt-1.5 text-[12.5px] text-[#7C828B]">52-week range</div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="flex flex-wrap gap-6 rounded-2xl bg-card px-7 py-6 lg:gap-12">
        <div className="min-w-0 flex-[1_1_380px]">
          <h3 className="text-[15px] font-semibold text-[#ECECE8]">About {displayName}</h3>
          {about ? <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.7] text-[#BDC3CB]">{about}</p> : null}
          {company.summary && company.summary !== about ? (
            <details className="mt-3.5">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[13.5px] font-medium text-link hover:text-link-hover">
                Full business profile
                <ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-[70ch] text-[14.5px] leading-[1.7] text-[#BDC3CB]">{company.summary}</p>
            </details>
          ) : company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3.5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-link hover:text-link-hover"
            >
              Full business profile
              <ArrowRight size={13} strokeWidth={1.9} aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div className="grid min-w-0 flex-[1_1_360px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-x-6 gap-y-[18px] pt-1">
          {facts.map((fact) => (
            <div key={fact.label}>
              <div className="text-xs text-[#6C727B]">{fact.label}</div>
              <div className="mt-1.5 text-sm text-[#DDDDD8]">{fact.value}</div>
            </div>
          ))}
          {company.website ? (
            <div>
              <div className="text-xs text-[#6C727B]">Website</div>
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-1.5 block text-sm text-link hover:text-link-hover">
                {websiteHost(company.website)}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {bars.length > 0 ? (
        <section id="financials" className="rounded-2xl bg-card px-7 py-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-[15px] font-semibold text-[#ECECE8]">Financial snapshot</h3>
            <span className="text-[12.5px] text-[#6C727B]">is the business growing and generating cash?</span>
            <span className="ml-auto text-xs text-[#6C727B]">Fiscal years</span>
          </div>
          <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-10 gap-y-7">
            {bars.map((series) => (
              <div key={series.label}>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[13px] text-[#9BA1A9]">{series.label}</span>
                </div>
                <div className="mt-1.5 text-[22px] font-normal tracking-[-0.01em] text-[#ECECE8]">{series.latest}</div>
                <div className="mt-4 flex h-[110px] items-end gap-2">
                  {series.bars.map((bar, index) => (
                    <div key={bar.year} className="flex h-full flex-1 flex-col items-stretch justify-end gap-1.5">
                      <span className="text-center text-[11px] text-[#7C828B]">{bar.label}</span>
                      <div
                        className="rounded-t-[3px]"
                        style={{
                          height: `${bar.height}px`,
                          background: index === series.bars.length - 1 ? "#8E9CE0" : "#2A3040",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  {series.bars.map((bar) => (
                    <span key={bar.year} className="flex-1 text-center text-[11px] text-[#6C727B]">
                      {String(bar.year).slice(2)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="min-w-0 flex-[2_1_560px] rounded-2xl bg-card px-7 py-6">
          <h3 className="text-[15px] font-semibold text-[#ECECE8]">Growth &amp; profitability</h3>
          <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-10 gap-y-6">
            <div>
              <div className="flex pb-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#6C727B] uppercase">
                <span className="flex-1">Growth</span>
                <span className="w-[72px] text-right">Latest</span>
              </div>
              <Row label="Revenue growth" value={formatGrowthPercent(financials?.revenueGrowth)} />
              <Row label="EPS growth" value={formatGrowthPercent(financials?.epsGrowth)} last />
            </div>
            <div>
              <div className="flex pb-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#6C727B] uppercase">
                <span className="flex-1">Profitability</span>
                <span className="w-[72px] text-right">Latest</span>
              </div>
              <MarginRow label="Gross margin" value={financials?.grossMargin} />
              <MarginRow label="Operating margin" value={financials?.operatingMargin} />
              <MarginRow label="Net margin" value={financials?.profitMargin} />
              <MarginRow label="ROE" value={financials?.roe} last />
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl bg-card px-7 py-6">
          <h3 className="text-[15px] font-semibold text-[#ECECE8]">Financial health</h3>
          <div className="mt-[18px] grid grid-cols-2 gap-x-4 gap-y-5">
            <HealthStat value={formatCompactMoney(cash, currency)} label="Cash & investments" />
            <HealthStat value={formatCompactMoney(debt, currency)} label="Total debt" />
            <HealthStat value={financials?.debtToEquity != null ? formatNumber(financials.debtToEquity, 2) : null} label="Debt / equity" />
            <HealthStat value={financials?.currentRatio != null ? formatNumber(financials.currentRatio, 2) : null} label="Current ratio" />
          </div>
          {cash != null && debt != null ? (
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex h-1.5 gap-0.5">
                <div className="rounded-[3px] bg-[#56A177] opacity-85" style={{ flex: Math.max(cash, 1) }} />
                <div className="rounded-[3px] bg-[#3A4048]" style={{ flex: Math.max(debt, 1) }} />
              </div>
              <div className="flex justify-between text-xs text-[#7C828B]">
                <span>Cash & investments</span>
                <span>Debt</span>
              </div>
            </div>
          ) : null}
          <p className="mt-auto pt-4 text-[12.5px] leading-relaxed text-[#8A9199]">
            {cash != null && debt != null
              ? cash >= debt
                ? `Cash and investments exceed total debt by ${formatCompactMoney(cash - debt, currency)}.`
                : `Total debt exceeds cash and investments by ${formatCompactMoney(debt - cash, currency)}.`
              : "Health figures appear when the filing data is available."}
          </p>
        </section>
      </div>

      <section className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-2xl border border-[#16191D] bg-[#0E1013] px-8 py-[30px]">
        <div className="min-w-0 flex-[1_1_420px]">
          <div className="text-[11px] font-semibold tracking-[0.15em] text-link uppercase">Research</div>
          <h3 className="mt-2.5 text-2xl font-light tracking-[-0.02em] text-[#ECECE8]">Go beyond the numbers</h3>
          <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-[#9BA1A9]">
            Understand the business, evaluate its growth, analyze valuation and identify the risks behind your investment thesis.
          </p>
          <div className="mt-[18px] flex flex-wrap gap-2">
            {["Business", "Growth", "Profitability", "Financial health", "Valuation", "Risks"].map((chip) => (
              <span key={chip} className="rounded-[7px] bg-[#15181C] px-[11px] py-[5px] text-[12.5px] text-[#9BA1A9]">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={instrumentResearchPath(company.symbol)}
          className="flex h-11 items-center gap-2 rounded-[10px] bg-cta px-5 text-sm font-semibold text-white hover:bg-cta-hover"
        >
          Research {displayName}
          <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
        </Link>
      </section>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[#6C727B]">
        <span>Quantora helps you think. It never tells you what to buy.</span>
        <span className="ml-auto">Delayed third-party data · not investment advice</span>
      </div>
    </div>
  );
}

function Row({ label, value, last = false }: { label: string; value: string | null; last?: boolean }) {
  return (
    <div className={`flex items-baseline py-3 ${last ? "border-y" : "border-t"} border-[#191C20]`}>
      <span className="min-w-0 flex-1 text-[13.5px] text-[#9BA1A9]">{label}</span>
      <span className="w-[72px] text-right text-[15px] text-[#ECECE8]">{value ?? "—"}</span>
    </div>
  );
}

function MarginRow({ label, value, last = false }: { label: string; value: number | null | undefined; last?: boolean }) {
  const formatted = formatRatioPercent(value);
  const width = value == null ? 0 : Math.min(100, Math.abs(value) <= 1 ? value * 100 : value);
  return (
    <div className={`flex items-center py-[11px] ${last ? "border-y" : "border-t"} border-[#191C20]`}>
      <span className="min-w-0 flex-1 text-[13.5px] text-[#9BA1A9]">{label}</span>
      <span className="mr-1 h-[3px] w-14 overflow-hidden rounded-sm bg-[#1E2228]">
        <span className="block h-[3px] bg-[#5B6ACB]" style={{ width: `${width}%` }} />
      </span>
      <span className="w-[72px] text-right text-[15px] text-[#ECECE8]">{formatted ?? "—"}</span>
    </div>
  );
}

function HealthStat({ value, label }: { value: string | null; label: string }) {
  return (
    <div>
      <div className="text-[21px] font-normal text-[#ECECE8]">{value ?? "—"}</div>
      <div className="mt-1 text-[12.5px] text-[#7C828B]">{label}</div>
    </div>
  );
}

function annualBars(annuals: CompanyProfile["annuals"], currency: string) {
  const rows = annuals.slice(-5);
  if (rows.length < 2) {
    return [];
  }
  const seriesOf = (label: string, pick: (row: CompanyProfile["annuals"][number]) => number | null) => {
    const values = rows.map((row) => pick(row)).filter((value): value is number => value != null);
    if (values.length < 2) {
      return null;
    }
    const max = Math.max(...values);
    return {
      label,
      latest: formatCompactMoney(values[values.length - 1], currency),
      bars: rows.map((row) => {
        const value = pick(row);
        return {
          year: row.year,
          label: value != null ? formatCompactMoney(value, currency)?.replace(/\.00$/, "") ?? "" : "",
          height: value == null || max === 0 ? 0 : Math.round((value / max) * 80),
        };
      }),
    };
  };
  return [
    seriesOf("Revenue", (row) => row.revenue),
    seriesOf("Net income", (row) => row.netIncome),
    seriesOf("Free cash flow", (row) => row.freeCashFlow),
  ].filter((series) => series != null);
}
