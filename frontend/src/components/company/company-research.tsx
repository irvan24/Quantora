"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { CompanyIdentity } from "@/components/company/company-identity";
import { CompanySkeleton } from "@/components/company/company-skeleton";
import {
  formatCompactMoney,
  formatPrice,
  getCompanyStatements,
  getInstrument,
  instrumentPath,
  instrumentThesisPath,
  instrumentValuationPath,
  shortSummary,
  type CompanyProfile,
  type StatementLine,
} from "@/lib/instruments";

type AreaId = "business" | "growth" | "profit" | "health" | "valuation" | "risks";

type Tile = { label: string; value: string };
type Table = { headers: string[]; rows: { label: string; cells: string[] }[] };

type Area = {
  id: AreaId;
  name: string;
  question: string;
  facts: string[];
  further: string;
  tiles: Tile[];
  table: Table | null;
};

const OPEN_QUESTIONS: { text: string; area: AreaId }[] = [
  { text: "Which products or customers actually drive revenue?", area: "business" },
  { text: "Is the latest growth rate repeatable?", area: "growth" },
  { text: "Can current margins hold if the mix of the business changes?", area: "profit" },
  { text: "What would have to stay true for this price to make sense?", area: "valuation" },
];

export function CompanyResearch({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filingsNote, setFilingsNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<AreaId>("business");
  const [reviewed, setReviewed] = useState<AreaId[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const profile = await getInstrument(symbol);
        if (controller.signal.aborted) {
          return;
        }
        if (profile.symbol && profile.symbol.toUpperCase() !== symbol.trim().toUpperCase()) {
          router.replace(`${instrumentPath(profile.symbol)}/research`);
        }
        setCompany(profile);
        setReviewed(readReviewed(profile.symbol));
        setLoading(false);
        try {
          const statements = await getCompanyStatements(profile.symbol, "ANNUAL", controller.signal);
          if (!controller.signal.aborted) {
            setLines(statements.lines);
          }
        } catch (err) {
          if (!controller.signal.aborted && !(err instanceof DOMException && err.name === "AbortError")) {
            setFilingsNote(err instanceof Error ? err.message : "Filings could not be loaded.");
          }
        }
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load this company.");
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [symbol, router]);

  const currency = company?.currency ?? "USD";
  const areas = useMemo(() => (company ? buildAreas(company, lines, currency) : []), [company, lines, currency]);
  const selected = areas.find((item) => item.id === area) ?? areas[0];
  const sides = useMemo(() => (company ? cases(company, lines, currency) : { bull: [], bear: [] }), [company, lines, currency]);
  const displayName = company ? company.name.replace(/\s+Inc\.?$/i, "").trim() || company.name : "";

  function toggleReviewed(id: AreaId) {
    if (!company) {
      return;
    }
    const next = reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
    setReviewed(next);
    writeReviewed(company.symbol, next);
  }

  function openArea(id: AreaId) {
    setArea(id);
    document.getElementById("research-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return <CompanySkeleton />;
  }
  if (error || !company || !selected) {
    return (
      <div className="px-4 py-10 sm:px-10 sm:py-14">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Company not found</h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">{error ?? "We could not find that company."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-4 pb-12 pt-3 sm:px-10">
      <CompanyIdentity company={company} tab="research" />
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[1_1_360px]">
          <h2 className="text-[22px] font-normal tracking-[-0.015em] text-[#ECECE8]">Research {displayName}</h2>
          <p className="mt-1.5 max-w-[58ch] text-sm text-[#8A9199]">Six questions. Each one uses the filings, then asks what they still don’t answer.</p>
        </div>
        <span className="text-[12.5px] text-[#7C828B]">
          {reviewed.length} of {areas.length} areas reviewed
        </span>
      </div>

      {filingsNote ? <p className="text-sm text-[#8A9199]">{filingsNote}</p> : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
        {areas.map((item) => {
          const active = item.id === selected.id;
          const done = reviewed.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setArea(item.id)}
              className={`flex min-h-[122px] flex-col rounded-xl px-4 py-3.5 text-left ${active ? "border border-[#2A3040] bg-[#171A1F]" : "border border-transparent bg-card hover:bg-[#15181C]"}`}
            >
              <span className="text-sm font-semibold text-[#ECECE8]">{item.name}</span>
              <span className="mt-1.5 text-[12.5px] leading-snug text-[#8A9199]">{item.question}</span>
              <span className="mt-auto flex items-center gap-2.5 pt-3.5">
                <span className="h-[3px] flex-1 overflow-hidden rounded-sm bg-[#1C1F24]">
                  <span className="block h-full bg-[#8E9CE0]" style={{ width: done ? "100%" : "0%" }} />
                </span>
                <span className="text-[11.5px] text-[#6C727B]">{done ? "Reviewed" : "Open"}</span>
              </span>
            </button>
          );
        })}
      </div>

      <section id="research-workspace" className="scroll-mt-6 rounded-2xl bg-card px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-end gap-4 border-b border-[#16191D] pb-5">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-[#6C727B] uppercase">Research area</div>
            <h3 className="mt-2 text-xl font-normal tracking-[-0.01em] text-[#ECECE8]">{selected.name}</h3>
            <p className="mt-1 text-sm text-[#9BA1A9]">{selected.question}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleReviewed(selected.id)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ${reviewed.includes(selected.id) ? "bg-[rgba(91,106,203,0.14)] text-[#AAB5EA]" : "border border-[#1E2228] text-[#7C828B] hover:text-[#ECECE8]"}`}
          >
            <Check size={12} strokeWidth={2.4} />
            {reviewed.includes(selected.id) ? "Reviewed" : "Mark as reviewed"}
          </button>
        </div>

        <div className="flex flex-col gap-4 pt-5">
          {selected.tiles.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
              {selected.tiles.map((tile) => (
                <div key={tile.label} className="rounded-[10px] bg-[#0E1013] px-3.5 py-3">
                  <div className="text-xs text-[#7C828B]">{tile.label}</div>
                  <div className="mt-1.5 text-[19px] font-light tracking-[-0.01em] text-[#ECECE8]">{tile.value}</div>
                </div>
              ))}
            </div>
          ) : null}
          {selected.table ? <EvidenceTable table={selected.table} /> : null}
          {selected.facts.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {selected.facts.map((fact) => (
                <li key={fact} className="flex gap-3 text-sm leading-relaxed text-[#C9CBC6]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-sm bg-[#3A4048]" />
                  {fact}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#8A9199]">Not enough filed history yet to answer this from the numbers.</p>
          )}
          <p className="text-[13.5px] leading-relaxed text-[#9BA1A9]">
            <span className="mr-2 text-xs font-medium text-[#6C727B]">Still open</span>
            {selected.further}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-card px-5 py-6 sm:px-7">
        <h3 className="text-[15px] font-semibold text-[#ECECE8]">Challenge the thesis</h3>
        <p className="mt-1 text-[12.5px] text-[#6C727B]">The strongest evidence on each side. Not a prediction.</p>
        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          <CaseList title="Bull case" note="Evidence that supports a thesis" mark="+" items={sides.bull} onOpen={openArea} />
          <CaseList title="Bear case" note="Evidence that challenges a thesis" mark="−" items={sides.bear} onOpen={openArea} />
        </div>
      </section>

      <section className="rounded-2xl bg-card px-4 pt-6 pb-2">
        <div className="px-3">
          <h3 className="text-[15px] font-semibold text-[#ECECE8]">Questions the filings don’t answer</h3>
        </div>
        <div className="mt-3">
          {OPEN_QUESTIONS.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => openArea(item.area)}
              className="flex w-full items-center gap-4 border-t border-[#16191D] px-3 py-3.5 text-left hover:bg-[#15181C]"
            >
              <span className="min-w-0 flex-1 text-[14.5px] leading-snug text-[#ECECE8]">{item.text}</span>
              <span className="rounded-md bg-[#16191D] px-2 py-0.5 text-xs text-[#7C828B]">{areas.find((entry) => entry.id === item.area)?.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-6 rounded-2xl bg-card px-7 py-6">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-medium text-[#ECECE8]">Ready to write it down?</div>
          <p className="mt-1 text-sm text-[#8A9199]">A thesis is your reason, plus what would prove you wrong.</p>
          <p className="mt-3 text-[12.5px] text-[#6C727B]">
            {reviewed.length > 0 ? `You’ve reviewed ${reviewed.length} of ${areas.length} areas.` : "You can start with any area."}
          </p>
        </div>
        <Link href={instrumentThesisPath(company.symbol)} className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#8E9CE0] px-4 text-sm font-semibold text-[#0A0B0C] hover:bg-[#AAB5EA]">
          Write a thesis
          <ArrowRight size={14} strokeWidth={2.1} />
        </Link>
      </section>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[#6C727B]">
        <span>Quantora organises evidence and questions. It doesn’t rate the company or recommend a decision.</span>
        <span className="ml-auto">
          <Link href={instrumentValuationPath(company.symbol)} className="hover:text-[#BDC3CB]">
            Valuation detail
          </Link>
          {" · "}
          Delayed third-party data · {currency}
        </span>
      </div>
    </div>
  );
}

function CaseList({
  title,
  note,
  mark,
  items,
  onOpen,
}: {
  title: string;
  note: string;
  mark: string;
  items: { text: string; area: AreaId }[];
  onOpen: (area: AreaId) => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E1013] px-5 pt-4 pb-2">
      <div className="text-sm font-semibold text-[#ECECE8]">{title}</div>
      <div className="mt-0.5 text-[12.5px] text-[#6C727B]">{note}</div>
      {items.length === 0 ? <p className="mt-4 border-t border-[#16191D] py-3 text-sm text-[#8A9199]">Nothing in the filings stands out on this side yet.</p> : null}
      {items.map((item) => (
        <div key={item.text} className="flex items-baseline gap-3 border-t border-[#16191D] py-2.5">
          <span className="w-3 text-[15px] text-[#8A9199]">{mark}</span>
          <span className="min-w-0 flex-1 text-sm leading-relaxed text-[#C9CBC6]">{item.text}</span>
          <button type="button" onClick={() => onOpen(item.area)} className="text-[11.5px] text-[#6C727B] hover:text-[#AAB5EA]">
            {labelFor(item.area)}
          </button>
        </div>
      ))}
    </div>
  );
}

function EvidenceTable({ table }: { table: Table }) {
  const columns = `minmax(140px,1.6fr) repeat(${table.headers.length}, minmax(72px,1fr))`;
  return (
    <div className="overflow-x-auto">
      <div className="grid border-b border-[#1E2228] pb-2 text-[11.5px] font-medium text-[#6C727B]" style={{ gridTemplateColumns: columns }}>
        <span />
        {table.headers.map((header) => (
          <span key={header} className="text-right">
            {header}
          </span>
        ))}
      </div>
      {table.rows.map((row) => (
        <div key={row.label} className="grid border-b border-[#15181B] py-2 text-[13.5px]" style={{ gridTemplateColumns: columns }}>
          <span className="text-[#9BA1A9]">{row.label}</span>
          {row.cells.map((cell, index) => (
            <span key={`${row.label}-${index}`} className={`text-right ${index === row.cells.length - 1 ? "font-medium text-[#BDC3CB]" : "text-[#C9CBC6]"}`}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function buildAreas(company: CompanyProfile, lines: StatementLine[], currency: string): Area[] {
  const first = lines[0];
  const last = lines[lines.length - 1];
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency) ?? "—";
  const year = last?.label ?? "the latest year";
  const summary = company.summary ? shortSummary(company.summary, 280) : null;
  const revenueCagr = first && last ? cagr(first.income.revenue, last.income.revenue, Math.max(1, lines.length - 1)) : null;
  const margins = last ? marginSet(last) : null;
  const earlierMargins = first && last && first !== last ? marginSet(first) : null;
  const netCash = last?.balance.cashAndInvestments != null && last.balance.totalDebt != null ? last.balance.cashAndInvestments - last.balance.totalDebt : null;
  const earlierNet = first && first !== last && first.balance.cashAndInvestments != null && first.balance.totalDebt != null ? first.balance.cashAndInvestments - first.balance.totalDebt : null;
  const returned = last ? abs(last.cashFlow.dividendsPaid) + abs(last.cashFlow.shareRepurchases) : null;
  const fcf = last?.cashFlow.freeCashFlow ?? null;
  const pe = company.financials?.peRatio ?? null;

  const growthRows = lines.slice(-5).map((line, index, rows) => {
    const previous = index === 0 ? lines[lines.length - rows.length - 1] : rows[index - 1];
    const change = previous ? growth(line.income.revenue, previous.income.revenue) : null;
    return { label: line.label, cells: [money(line.income.revenue), signed(change)] };
  });

  return [
    {
      id: "business",
      name: "Business",
      question: "How does this company make money?",
      tiles: [
        { label: `Revenue · ${year}`, value: money(last?.income.revenue) },
        { label: "Gross profit", value: money(last?.income.grossProfit) },
        { label: "Employees", value: company.employees ? new Intl.NumberFormat("en-US").format(company.employees) : "—" },
      ].filter((tile) => tile.value !== "—"),
      table: null,
      facts: [
        summary ?? "The company description isn’t available for this listing.",
        "Product and regional mix aren’t in the standard filing feed, so revenue here is the whole company.",
      ],
      further: "Which products, customers or countries would have to keep working for this revenue to hold up?",
    },
    {
      id: "growth",
      name: "Growth",
      question: "Is the business growing, and from what?",
      tiles: revenueCagr != null && first && last ? [{ label: `${lines.length - 1}Y revenue CAGR`, value: signed(revenueCagr) }] : [],
      table: growthRows.length > 1 ? { headers: ["Revenue", "Change"], rows: growthRows } : null,
      facts: [
        revenueCagr != null && first && last
          ? `Revenue grew ${signed(revenueCagr)} a year from ${first.label} to ${last.label}.`
          : "At least two fiscal years are needed before a growth rate means anything.",
      ],
      further: "Was the latest year a one-off, or the pace you should expect from here?",
    },
    {
      id: "profit",
      name: "Profitability",
      question: "How much of revenue becomes profit and cash?",
      tiles: [
        { label: "Free cash flow", value: money(fcf) },
        { label: "FCF / net income", value: ratio(fcf, last?.income.netIncome) },
      ].filter((tile) => tile.value !== "—"),
      table:
        margins && earlierMargins && first
          ? {
              headers: [first.label, last.label, "Change"],
              rows: [
                marginRow("Gross margin", earlierMargins.gross, margins.gross),
                marginRow("Operating margin", earlierMargins.operating, margins.operating),
                marginRow("Net margin", earlierMargins.net, margins.net),
                marginRow("FCF margin", earlierMargins.fcf, margins.fcf),
              ].filter((row) => row.cells[0] !== "—" || row.cells[1] !== "—"),
            }
          : null,
      facts: [
        fcf != null && last?.income.netIncome
          ? `${year} converted ${ratio(fcf, last.income.netIncome)} of net income into free cash flow.`
          : "Cash conversion appears once both net income and free cash flow are filed.",
      ],
      further: "How much of any margin change came from mix, pricing, or costs?",
    },
    {
      id: "health",
      name: "Financial health",
      question: "Can the business fund itself?",
      tiles: [
        { label: "Cash & investments", value: money(last?.balance.cashAndInvestments) },
        { label: "Total debt", value: money(last?.balance.totalDebt) },
        { label: "Net cash", value: netCash == null ? "—" : money(netCash) },
        {
          label: "Current ratio",
          value: ratio(last?.balance.totalCurrentAssets ?? null, last?.balance.totalCurrentLiabilities ?? null, false),
        },
      ].filter((tile) => tile.value !== "—"),
      table:
        earlierNet != null && netCash != null && first
          ? { headers: [first.label, last.label, "Change"], rows: [{ label: "Net cash", cells: [money(earlierNet), money(netCash), money(netCash - earlierNet)] }] }
          : null,
      facts: [
        netCash == null
          ? "Cash and debt aren’t both available for the latest filing."
          : netCash >= 0
            ? `Cash and investments exceed debt by ${money(netCash)}.`
            : `Debt exceeds cash and investments by ${money(Math.abs(netCash))}.`,
        returned != null && fcf != null
          ? returned > fcf
            ? `Dividends and buybacks (${money(returned)}) were larger than free cash flow (${money(fcf)}).`
            : `Free cash flow covered dividends and buybacks, with ${money(fcf - returned)} left over.`
          : "Shareholder payouts appear once dividends, buybacks and free cash flow are filed.",
      ],
      further: "What would capital returns look like if operating cash flow fell?",
    },
    {
      id: "valuation",
      name: "Valuation",
      question: "What is the price asking you to believe?",
      tiles: [
        { label: "Price", value: formatPrice(company.quote?.price, currency) ?? "—" },
        { label: "Market value", value: money(company.quote?.marketCap) },
        { label: "P/E", value: pe != null && pe > 0 ? `${pe.toFixed(1)}x` : "—" },
        {
          label: "Price / FCF",
          value: company.quote?.marketCap != null && fcf != null && fcf > 0 ? `${(company.quote.marketCap / fcf).toFixed(1)}x` : "—",
        },
      ].filter((tile) => tile.value !== "—"),
      table: null,
      facts: [
        pe != null && pe > 0
          ? `Each dollar of trailing earnings currently costs about $${pe.toFixed(0)}.`
          : "A trailing P/E isn’t available, so the price can’t be compared with recent earnings yet.",
        revenueCagr != null ? `Revenue grew ${signed(revenueCagr)} a year over the filed history. The multiple only makes sense next to a growth rate you believe.` : "Pair the multiple with a growth rate you can defend.",
      ],
      further: "What growth rate seems realistic for the next decade, and what multiple would you still pay if it slowed?",
    },
    {
      id: "risks",
      name: "Risks",
      question: "What could weaken the thesis?",
      tiles: [],
      table: null,
      facts: riskFacts({ returned, fcf, netCash, earlierNet, pe, lines, year, money }),
      further: "Which of these would change your mind, and which are you willing to live with?",
    },
  ];
}

function cases(company: CompanyProfile, lines: StatementLine[], currency: string) {
  const first = lines[0];
  const last = lines[lines.length - 1];
  const money = (value: number | null | undefined) => formatCompactMoney(value, currency) ?? "—";
  const bull: { text: string; area: AreaId }[] = [];
  const bear: { text: string; area: AreaId }[] = [];
  const revenueCagr = first && last ? cagr(first.income.revenue, last.income.revenue, Math.max(1, lines.length - 1)) : null;
  if (last?.cashFlow.freeCashFlow != null && last.cashFlow.freeCashFlow > 0) {
    bull.push({ text: `Free cash flow was ${money(last.cashFlow.freeCashFlow)} in ${last.label}.`, area: "profit" });
  }
  if (revenueCagr != null && revenueCagr > 0 && first && last) {
    bull.push({ text: `Revenue grew ${signed(revenueCagr)} a year from ${first.label} to ${last.label}.`, area: "growth" });
  }
  const startMargin = first ? marginSet(first).gross : null;
  const endMargin = last ? marginSet(last).gross : null;
  if (startMargin != null && endMargin != null && endMargin - startMargin >= 2 && first && last) {
    bull.push({ text: `Gross margin widened from ${startMargin.toFixed(1)}% to ${endMargin.toFixed(1)}%.`, area: "profit" });
  }
  const netCash = last && last.balance.cashAndInvestments != null && last.balance.totalDebt != null ? last.balance.cashAndInvestments - last.balance.totalDebt : null;
  if (netCash != null && netCash > 0) {
    bull.push({ text: `Cash and investments exceed debt by ${money(netCash)}.`, area: "health" });
  }
  const returned = last ? abs(last.cashFlow.dividendsPaid) + abs(last.cashFlow.shareRepurchases) : 0;
  const fcf = last?.cashFlow.freeCashFlow ?? null;
  if (fcf != null && returned > fcf) {
    bear.push({ text: `Dividends and buybacks exceeded free cash flow in ${last?.label}.`, area: "health" });
  }
  if (lines.length >= 3) {
    const latest = growth(lines[lines.length - 1].income.revenue, lines[lines.length - 2].income.revenue);
    const prior = growth(lines[lines.length - 2].income.revenue, lines[lines.length - 3].income.revenue);
    if (latest != null && prior != null && latest + 2 < prior) {
      bear.push({ text: `The latest revenue change (${signed(latest)}) was slower than the year before (${signed(prior)}).`, area: "growth" });
    }
  }
  const pe = company.financials?.peRatio;
  if (pe != null && pe >= 30) {
    bear.push({ text: `The trailing P/E is ${pe.toFixed(1)}x, so more of the outcome depends on earnings that are not here yet.`, area: "valuation" });
  }
  const earlierNet = first && first !== last && first.balance.cashAndInvestments != null && first.balance.totalDebt != null ? first.balance.cashAndInvestments - first.balance.totalDebt : null;
  if (earlierNet != null && netCash != null && netCash < earlierNet) {
    bear.push({ text: `Net cash fell from ${money(earlierNet)} to ${money(netCash)}.`, area: "health" });
  }
  return { bull: bull.slice(0, 3), bear: bear.slice(0, 3) };
}

function riskFacts(input: {
  returned: number | null;
  fcf: number | null;
  netCash: number | null;
  earlierNet: number | null;
  pe: number | null;
  lines: StatementLine[];
  year: string;
  money: (value: number | null | undefined) => string;
}) {
  const facts: string[] = [];
  if (input.returned != null && input.fcf != null && input.returned > input.fcf) {
    facts.push(`In ${input.year}, cash returned to shareholders was larger than free cash flow.`);
  }
  if (input.earlierNet != null && input.netCash != null && input.netCash < input.earlierNet) {
    facts.push(`Net cash declined from ${input.money(input.earlierNet)} to ${input.money(input.netCash)} over the filed years.`);
  }
  if (input.pe != null && input.pe >= 30) {
    facts.push(`A ${input.pe.toFixed(1)}x trailing P/E leaves less room if growth disappoints.`);
  }
  if (input.lines.length >= 3) {
    const latest = growth(input.lines[input.lines.length - 1].income.revenue, input.lines[input.lines.length - 2].income.revenue);
    if (latest != null && latest < 0) {
      facts.push(`Revenue fell ${signed(latest)} in the latest year.`);
    }
  }
  if (facts.length === 0) {
    facts.push("The filings don’t show a single stress point by themselves. Concentration, competition and regulation still sit outside this feed.");
  }
  return facts;
}

function marginSet(line: StatementLine) {
  return {
    gross: percentOf(line.income.grossProfit, line.income.revenue),
    operating: percentOf(line.income.operatingIncome, line.income.revenue),
    net: percentOf(line.income.netIncome, line.income.revenue),
    fcf: percentOf(line.cashFlow.freeCashFlow, line.income.revenue),
  };
}

function marginRow(label: string, earlier: number | null, latest: number | null) {
  const delta = earlier != null && latest != null ? latest - earlier : null;
  const deltaText = delta == null ? "—" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toFixed(1)} pts`;
  return { label, cells: [percent(earlier), percent(latest), deltaText] };
}

function labelFor(area: AreaId) {
  return { business: "Business", growth: "Growth", profit: "Profitability", health: "Health", valuation: "Valuation", risks: "Risks" }[area];
}

function readReviewed(symbol: string): AreaId[] {
  try {
    const raw = window.localStorage.getItem(`quantora.research.${symbol}`);
    const parsed = raw ? (JSON.parse(raw) as AreaId[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReviewed(symbol: string, areas: AreaId[]) {
  window.localStorage.setItem(`quantora.research.${symbol}`, JSON.stringify(areas));
}

function percentOf(numer: number | null | undefined, denom: number | null | undefined) {
  if (numer == null || denom == null || denom === 0) {
    return null;
  }
  return (numer / denom) * 100;
}

function percent(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function growth(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function cagr(first: number | null | undefined, last: number | null | undefined, years: number) {
  if (first == null || last == null || first <= 0 || last <= 0 || years <= 0) {
    return null;
  }
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function signed(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function ratio(numer: number | null | undefined, denom: number | null | undefined, asPercent = true) {
  if (numer == null || denom == null || denom === 0) {
    return "—";
  }
  const value = numer / denom;
  return asPercent ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
}

function abs(value: number | null | undefined) {
  return value == null ? 0 : Math.abs(value);
}
