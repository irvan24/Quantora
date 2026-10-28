"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { CompanyIdentity } from "@/components/company/company-identity";
import { CompanySkeleton } from "@/components/company/company-skeleton";
import {
  formatPrice,
  getCompanyStatements,
  getInstrument,
  getInstrumentPrices,
  instrumentFinancialsPath,
  instrumentPath,
  type CompanyProfile,
  type PricePoint,
  type StatementLine,
} from "@/lib/instruments";

const INFO: Record<string, { title: string; text: string }> = {
  pe: { title: "P/E ratio", text: "Share price divided by earnings per share. Snapshot uses trailing twelve months when the provider sends it." },
  fpe: { title: "Forward P/E", text: "Share price divided by expected earnings per share for the next 12 months." },
  pfcf: { title: "Price / free cash flow", text: "Market value divided by free cash flow. History uses the fiscal-year figure and the price at year-end." },
  ev: { title: "EV / EBITDA", text: "Enterprise value — market value plus debt, minus cash — divided by operating profit before depreciation." },
  peg: { title: "PEG ratio", text: "P/E divided by the annual EPS growth rate over the years shown. It is hidden when earnings did not grow." },
  cagr: { title: "CAGR", text: "Average annual growth rate between the first and last fiscal year in the series." },
};

type MetricKey = "pe" | "pfcf" | "ev";

const METRICS: { key: MetricKey; label: string; short: string }[] = [
  { key: "pe", label: "P/E", short: "P/E" },
  { key: "pfcf", label: "Price / FCF", short: "P/FCF" },
  { key: "ev", label: "EV / EBITDA", short: "EV/EBITDA" },
];

export function CompanyValuation({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricKey>("pe");
  const [hover, setHover] = useState<number | null>(null);
  const [info, setInfo] = useState<{ key: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      setCompany(null);
      try {
        const profile = await getInstrument(symbol);
        if (controller.signal.aborted) {
          return;
        }
        if (profile.symbol && profile.symbol.toUpperCase() !== symbol.trim().toUpperCase()) {
          router.replace(`${instrumentPath(profile.symbol)}/valuation`);
        }
        setCompany(profile);
        const [statements, series] = await Promise.all([
          getCompanyStatements(profile.symbol, "ANNUAL", controller.signal),
          getInstrumentPrices(profile.symbol).catch(() => [] as PricePoint[]),
        ]);
        if (controller.signal.aborted) {
          return;
        }
        setLines(statements.lines);
        setPrices(series);
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load this company.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [symbol, router]);

  const history = useMemo(() => yearPoints(lines, prices, company?.quote?.marketCap ?? null), [lines, prices, company]);
  const available = METRICS.filter((item) => history.filter((point) => point[item.key] != null).length >= 2);
  const active = available.some((item) => item.key === metric) ? metric : available[0]?.key ?? "pe";
  const series = history.filter((point) => point[active] != null);
  const values = series.map((point) => point[active] as number);
  const latest = series[series.length - 1];
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;
  const current = values[values.length - 1] ?? null;
  const diff = average != null && average !== 0 && current != null ? (current / average - 1) * 100 : null;

  const displayName = company ? company.name.replace(/\s+Inc\.?$/i, "").trim() || company.name : "";
  const price = company?.quote?.price ?? null;
  const currency = company?.currency ?? "USD";
  const asOf = formatAsOf(company?.quote?.asOf ?? null);
  const snapshot = company ? snapshotCards(company, lines) : [];
  const growth = growthView(lines, snapshot.find((card) => card.key === "pe")?.raw ?? null);
  const infoCard = info ? INFO[info.key] : null;
  const chart = values.length >= 2 ? chartGeometry(values) : null;
  const hoverIndex = hover != null && hover < series.length ? hover : null;

  function showInfo(key: string, event: MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setInfo({ key, x: box.right + 10, y: box.top - 8 });
  }

  if (loading) {
    return <CompanySkeleton />;
  }
  if (error || !company) {
    return (
      <div className="px-4 py-10 sm:px-10 sm:py-14">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Company not found</h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">{error ?? "We could not find that company."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-4 pb-12 pt-3 sm:px-10">
      <CompanyIdentity company={company} tab="valuation" />
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[1_1_360px]">
          <h2 className="text-[22px] font-normal tracking-[-0.015em] text-[#ECECE8]">Valuation</h2>
          <p className="mt-1.5 max-w-[62ch] text-sm text-[#8A9199]">
            The price the market is asking for {displayName}, set against its earnings, cash and own history.
          </p>
        </div>
        <span className="text-xs text-[#6C727B]">
          {asOf ? `As of ${asOf}` : "Latest price"}
          {price != null ? ` · ${formatPrice(price, currency)}` : ""}
        </span>
      </div>

      {snapshot.length > 0 ? (
        <section className="rounded-2xl bg-card px-0 py-[22px]">
          <div className="flex flex-wrap items-baseline gap-3 px-7">
            <h3 className="text-[15px] font-semibold text-[#ECECE8]">Valuation snapshot</h3>
            <span className="text-[12.5px] text-[#6C727B]">what you pay per dollar of earnings and cash</span>
          </div>
          <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-[18px]">
            {snapshot.map((card, index) => (
              <div key={card.key} className={`min-w-0 px-5 sm:px-7 ${index > 0 ? "sm:border-l sm:border-[#191C20]" : ""}`}>
                <div className="flex items-center gap-1.5 text-[13px] text-[#9BA1A9]">
                  {card.label}
                  <TipButton label={card.label} onEnter={(event) => showInfo(card.key, event)} onLeave={() => setInfo(null)} />
                </div>
                <div className="mt-2 text-[26px] font-light tracking-[-0.02em] text-[#ECECE8]">{card.value}</div>
                <div className="mt-1 text-xs text-[#6C727B]">{card.basis}</div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-[15px] text-dim">Valuation multiples appear once a price and a filed earnings figure are both available.</p>
      )}

      {chart && latest ? (
        <section className="rounded-2xl bg-card px-4 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="min-w-0 flex-[1_1_280px]">
              <h3 className="text-[15px] font-semibold text-[#ECECE8]">Valuation history</h3>
              <span className="text-[12.5px] text-[#6C727B]">fiscal year-end multiple, using that year’s price</span>
            </div>
            <Seg>
              {available.map((item) => (
                <SegBtn key={item.key} active={item.key === active} onClick={() => { setMetric(item.key); setHover(null); }}>
                  {item.label}
                </SegBtn>
              ))}
            </Seg>
          </div>
          <div className="mt-[22px] flex flex-wrap items-end gap-x-12 gap-y-5">
            <div>
              <div className="flex items-center gap-2 text-[12.5px] text-[#9BA1A9]">
                <span className="h-0.5 w-2.5 rounded-sm bg-[#8E9CE0]" />
                {latest.label} {METRICS.find((item) => item.key === active)?.short}
              </div>
              <div className="mt-1.5 text-[32px] font-light tracking-[-0.02em] text-[#ECECE8]">{multiple(current)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[12.5px] text-[#9BA1A9]">
                <span className="w-2.5 border-t border-dashed border-[#8A9199]" />
                {series.length}Y average
              </div>
              <div className="mt-1.5 text-[32px] font-light tracking-[-0.02em] text-[#BDC3CB]">{multiple(average)}</div>
            </div>
            <div className="pb-1.5">
              <div className="text-[12.5px] text-[#6C727B]">{series.length}Y range</div>
              <div className="mt-1 text-sm text-[#9BA1A9]">
                {multiple(low)} – {multiple(high)}
              </div>
            </div>
            {diff != null ? (
              <div className="pb-1.5 text-[12.5px] text-[#7C828B] sm:ml-auto">
                {Math.abs(diff).toFixed(0)}% {diff >= 0 ? "above" : "below"} its {series.length}-year average
              </div>
            ) : null}
          </div>
          <div
            className="relative mt-[22px] h-[240px] pr-12"
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const index = Math.max(0, Math.min(series.length - 1, Math.round(((event.clientX - box.left) / Math.max(box.width - 48, 1)) * (series.length - 1))));
              setHover(index);
            }}
            onMouseLeave={() => setHover(null)}
          >
            <svg viewBox="0 0 1000 260" preserveAspectRatio="none" width="100%" height="240" className="block overflow-visible">
              {chart.ticks.map((tick) => (
                <line key={tick} x1="0" x2="1000" y1={chart.y(tick)} y2={chart.y(tick)} stroke="#191C20" />
              ))}
              <path d={`${chart.line} L1000 250 L0 250 Z`} fill="rgba(142,156,224,0.07)" />
              {average != null ? <line x1="0" x2="1000" y1={chart.y(average)} y2={chart.y(average)} stroke="#8A9199" strokeWidth="1.25" strokeDasharray="5 5" /> : null}
              <path d={chart.line} fill="none" stroke="#8E9CE0" strokeWidth="1.9" strokeLinejoin="round" />
            </svg>
            {average != null ? (
              <div className="pointer-events-none absolute left-0 bg-card pr-1.5 text-[11px] text-[#9BA1A9]" style={{ top: `calc(${chart.top(average)}% - 20px)` }}>
                Avg {multiple(average)}
              </div>
            ) : null}
            <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-[#8E9CE0] shadow-[0_0_0_3px_#111316]" style={{ left: "100%", top: `${chart.top(current ?? 0)}%`, margin: "-5px 0 0 -5px" }} />
            {hoverIndex != null ? (
              <>
                <span className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#262B33]" style={{ left: `${(hoverIndex / (series.length - 1)) * 100}%` }} />
                <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-[#ECECE8] shadow-[0_0_0_3px_#111316]" style={{ left: `${(hoverIndex / (series.length - 1)) * 100}%`, top: `${chart.top(values[hoverIndex])}%`, margin: "-5px 0 0 -5px" }} />
                <div
                  className="pointer-events-none absolute -top-1.5 rounded-lg bg-[#1A1D22] px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                  style={{ left: `${(hoverIndex / (series.length - 1)) * 100}%`, transform: hoverIndex > series.length * 0.8 ? "translateX(-100%)" : hoverIndex < 1 ? "none" : "translateX(-50%)" }}
                >
                  <span className="text-[#8A9199]">{series[hoverIndex].label}</span>
                  <span className="ml-2.5 font-semibold text-[#ECECE8]">{multiple(values[hoverIndex])}</span>
                </div>
              </>
            ) : null}
            {chart.ticks.map((tick) => (
              <div key={tick} className="absolute right-0 text-[11.5px] text-[#6C727B]" style={{ top: `calc(${chart.top(tick)}% - 8px)` }}>
                {tick.toFixed(0)}x
              </div>
            ))}
          </div>
          <div className="relative mt-2.5 mr-12 h-3.5">
            {series.map((point, index) => (
              <span key={point.date} className="absolute -translate-x-1/2 text-[11px] whitespace-nowrap text-[#6C727B]" style={{ left: `${series.length === 1 ? 0 : (index / (series.length - 1)) * 100}%` }}>
                {point.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {growth ? (
        <section className="rounded-2xl bg-card px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-[15px] font-semibold text-[#ECECE8]">Valuation vs growth</h3>
            <span className="text-[12.5px] text-[#6C727B]">a multiple reads differently depending on how fast earnings grow</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="min-w-[110px]">
              <div className="text-[12.5px] text-[#9BA1A9]">P/E</div>
              <div className="mt-1.5 text-2xl font-light tracking-[-0.015em] text-[#ECECE8]">{multiple(growth.pe)}</div>
            </div>
            <span className="pt-4 text-lg font-light text-[#484D55]">÷</span>
            <div className="min-w-[150px]">
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#9BA1A9]">
                EPS growth · {growth.spanYears}Y CAGR
                <TipButton label="CAGR" onEnter={(event) => showInfo("cagr", event)} onLeave={() => setInfo(null)} />
              </div>
              <div className="mt-1.5 text-2xl font-light tracking-[-0.015em] text-[#ECECE8]">{signedPercent(growth.epsCagr)}</div>
            </div>
            {growth.peg != null ? (
              <>
                <span className="pt-4 text-lg font-light text-[#484D55]">=</span>
                <div className="min-w-[110px] rounded-[10px] bg-[rgba(91,106,203,0.09)] px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-[12.5px] text-[#BDC3CB]">
                    PEG ratio
                    <TipButton label="PEG ratio" onEnter={(event) => showInfo("peg", event)} onLeave={() => setInfo(null)} />
                  </div>
                  <div className="mt-1.5 text-2xl font-light tracking-[-0.015em] text-[#ECECE8]">{growth.peg.toFixed(2)}</div>
                </div>
              </>
            ) : (
              <p className="max-w-[28ch] text-[12.5px] text-[#6C727B]">PEG stays hidden when earnings did not grow over this span.</p>
            )}
            {growth.revenueCagr != null ? (
              <div className="min-w-[150px] border-l border-[#1E2228] pl-7">
                <div className="text-[12.5px] text-[#9BA1A9]">Revenue growth · {growth.spanYears}Y CAGR</div>
                <div className="mt-1.5 text-2xl font-light tracking-[-0.015em] text-[#ECECE8]">{signedPercent(growth.revenueCagr)}</div>
              </div>
            ) : null}
            <div className="pt-4 text-xs text-[#6C727B] sm:ml-auto">{growth.span}</div>
          </div>
        </section>
      ) : null}

      <div className="flex justify-center">
        <Link href={instrumentFinancialsPath(company.symbol)} className="inline-flex h-9 items-center rounded-[9px] border border-[#1E2228] px-4 text-[13px] font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-[#ECECE8]">
          See the filings behind these multiples
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[#6C727B]">
        <span>Quantora shows valuation evidence. It doesn’t estimate fair value or rate the stock.</span>
        <span className="ml-auto">Delayed third-party data · {currency}</span>
      </div>
      {infoCard ? (
        <div className="pointer-events-none fixed z-50 w-[250px] rounded-[10px] bg-[#1A1D22] px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]" style={{ left: Math.min(info!.x, globalThis.innerWidth - 270), top: info!.y }}>
          <div className="text-[12.5px] font-semibold text-[#ECECE8]">{infoCard.title}</div>
          <div className="mt-1 text-[12.5px] leading-snug text-[#9BA1A9]">{infoCard.text}</div>
        </div>
      ) : null}
    </div>
  );
}

function snapshotCards(company: CompanyProfile, lines: StatementLine[]) {
  const latest = lines[lines.length - 1];
  const financials = company.financials;
  const marketCap = company.quote?.marketCap ?? null;
  const price = company.quote?.price ?? null;
  const eps = latest?.income.epsDiluted ?? latest?.income.eps ?? null;
  const cards: { key: string; label: string; value: string; basis: string; raw: number | null }[] = [];
  const reportedPe = financials?.peRatio != null && financials.peRatio > 0 ? financials.peRatio : null;
  const pe = reportedPe ?? (price != null && eps != null && eps > 0 ? price / eps : null);
  if (pe != null) {
    cards.push({
      key: "pe",
      label: "P/E ratio",
      value: multiple(pe),
      basis: reportedPe != null ? "Trailing 12 months" : latest ? `Today’s price / ${latest.label} earnings` : "Latest filing",
      raw: pe,
    });
  }
  if (financials?.forwardPe != null && financials.forwardPe > 0) {
    cards.push({ key: "fpe", label: "Forward P/E", value: multiple(financials.forwardPe), basis: "Next 12 months, estimated", raw: financials.forwardPe });
  }
  const fcf = latest?.cashFlow.freeCashFlow ?? null;
  if (marketCap != null && fcf != null && fcf > 0) {
    cards.push({
      key: "pfcf",
      label: "Price / FCF",
      value: multiple(marketCap / fcf),
      basis: latest ? `Today’s value / ${latest.label} free cash flow` : "Latest free cash flow",
      raw: marketCap / fcf,
    });
  }
  const ebitda = latest?.income.ebitda ?? null;
  if (marketCap != null && ebitda != null && ebitda > 0 && latest) {
    const enterprise = marketCap + (latest.balance.totalDebt ?? 0) - (latest.balance.cashAndInvestments ?? 0);
    if (enterprise > 0) {
      cards.push({
        key: "ev",
        label: "EV / EBITDA",
        value: multiple(enterprise / ebitda),
        basis: `Today’s value, ${latest.label} debt, cash and EBITDA`,
        raw: enterprise / ebitda,
      });
    }
  }
  return cards;
}

function growthView(lines: StatementLine[], pe: number | null) {
  const earnings = lines.filter((line) => (line.income.epsDiluted ?? line.income.eps ?? 0) > 0);
  if (earnings.length < 2) {
    return null;
  }
  const first = earnings[0];
  const last = earnings[earnings.length - 1];
  const years = Math.max(1, earnings.length - 1);
  const epsCagr = cagr(first.income.epsDiluted ?? first.income.eps, last.income.epsDiluted ?? last.income.eps, years);
  const revenueCagr = cagr(first.income.revenue, last.income.revenue, years);
  if (epsCagr == null && revenueCagr == null) {
    return null;
  }
  const peg = pe != null && epsCagr != null && epsCagr > 0 ? pe / epsCagr : null;
  return {
    pe,
    epsCagr,
    revenueCagr,
    peg,
    spanYears: years,
    span: `${first.label} → ${last.label}`,
  };
}

function yearPoints(lines: StatementLine[], prices: PricePoint[], reportedCap: number | null) {
  const draft = lines.flatMap((line) => {
    const price = priceOn(line.date, prices);
    const year = line.fiscalYear;
    if (price == null || year == null) {
      return [];
    }
    const shares = line.income.dilutedShares;
    const cap = shares != null && shares > 0 ? price * shares : null;
    return [{ line, price, year, cap }];
  });
  const scale = shareScale(draft[draft.length - 1]?.cap ?? null, reportedCap);
  return draft.map(({ line, price, year, cap }) => {
    const marketCap = cap == null || scale == null ? null : cap * scale;
    const eps = line.income.epsDiluted ?? line.income.eps;
    const ebitda = line.income.ebitda;
    const fcf = line.cashFlow.freeCashFlow;
    const enterprise = marketCap == null ? null : marketCap + (line.balance.totalDebt ?? 0) - (line.balance.cashAndInvestments ?? 0);
    return {
      year,
      date: line.date,
      label: `FY${year}`,
      pe: eps != null && eps > 0 ? price / eps : null,
      pfcf: marketCap != null && fcf != null && fcf > 0 ? marketCap / fcf : null,
      ev: enterprise != null && enterprise > 0 && ebitda != null && ebitda > 0 ? enterprise / ebitda : null,
    };
  });
}

function shareScale(computedCap: number | null, reportedCap: number | null) {
  if (computedCap == null || computedCap <= 0 || reportedCap == null || reportedCap <= 0) {
    return computedCap == null ? null : 1;
  }
  const ratio = computedCap / reportedCap;
  if (ratio > 0.2 && ratio < 5) {
    return 1;
  }
  return null;
}

function priceOn(date: string, prices: PricePoint[]) {
  let close: number | null = null;
  for (const point of prices) {
    if (point.date <= date) {
      close = point.close;
    } else {
      break;
    }
  }
  return close;
}

function chartGeometry(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = max - min > 20 ? 10 : 5;
  const low = Math.max(0, Math.floor((min - 1) / step) * step);
  const high = Math.ceil((max + 1) / step) * step || low + step;
  const ticks: number[] = [];
  for (let tick = low; tick <= high + 1e-9; tick += step) {
    ticks.push(tick);
  }
  const y = (value: number) => 250 - ((value - low) / (high - low || 1)) * 240;
  const line = values.map((value, index) => `${index ? "L" : "M"}${(values.length === 1 ? 0 : (index / (values.length - 1)) * 1000).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
  return { ticks, y, line, top: (value: number) => (y(value) / 260) * 100 };
}

function cagr(first: number | null, last: number | null, years: number) {
  if (first == null || last == null || first <= 0 || last <= 0 || years <= 0) {
    return null;
  }
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function multiple(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)}x`;
}

function signedPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function formatAsOf(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function TipButton({ label, onEnter, onLeave }: { label: string; onEnter: (event: MouseEvent<HTMLButtonElement>) => void; onLeave: () => void }) {
  return (
    <button type="button" className="text-[#5E646D] hover:text-link" aria-label={label} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Info size={13} strokeWidth={1.8} />
    </button>
  );
}

function Seg({ children }: { children: ReactNode }) {
  return <div className="flex gap-0.5 rounded-[9px] bg-[#0E1013] p-0.5">{children}</div>;
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`h-7 rounded-[7px] px-3 text-[12.5px] whitespace-nowrap ${active ? "bg-[#1B1F25] font-semibold text-[#ECECE8]" : "font-medium text-[#7C828B] hover:text-[#ECECE8]"}`}>
      {children}
    </button>
  );
}
