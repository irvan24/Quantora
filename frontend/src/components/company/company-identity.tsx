"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { apiBlob } from "@/lib/auth";
import {
  formatPrice,
  formatSignedMoney,
  instrumentFinancialsPath,
  instrumentPath,
  instrumentResearchPath,
  instrumentThesisPath,
  instrumentValuationPath,
  type CompanyProfile,
} from "@/lib/instruments";

type Tab = "overview" | "financials" | "valuation" | "research" | "thesis";

export function CompanyIdentity({ company, tab }: { company: CompanyProfile; tab: Tab }) {
  const currency = company.currency ?? "USD";
  const quote = company.quote;
  const changePercent =
    quote?.price && quote.change != null && quote.price !== 0
      ? (quote.change / quote.price) * 100
      : quote?.changePercent;
  const up = (quote?.change ?? changePercent ?? 0) >= 0;
  const base = instrumentPath(company.symbol);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <div className="flex min-w-0 flex-[1_1_360px] items-center gap-[18px]">
          <CompanyMark symbol={company.symbol} name={company.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-[28px] font-normal tracking-[-0.02em] text-[#ECECE8]">{company.name}</h1>
              <span className="text-sm font-semibold tracking-[0.02em] text-[#BDC3CB]">{company.symbol}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13.5px] text-[#8A9199]">
              {[company.exchange, company.sector, company.industry].filter(Boolean).map((item, index) => (
                <span key={item} className="flex items-center gap-2">
                  {index > 0 ? <span className="text-[#3A4048]">·</span> : null}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-[30px] font-light tracking-[-0.02em] text-[#ECECE8]">{formatPrice(quote?.price, currency) ?? "—"}</div>
          {changePercent != null || quote?.change != null ? (
            <div className={`flex gap-2.5 text-[13.5px] font-medium ${up ? "text-[#56A177]" : "text-[#C1605A]"}`}>
              {changePercent != null ? <span>{`${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}</span> : null}
              {formatSignedMoney(quote?.change, currency) ? <span>{formatSignedMoney(quote?.change, currency)}</span> : null}
              <span className="font-normal text-[#6C727B]">today</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/watchlist"
            className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#1E2228] px-3.5 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#14171B] hover:text-[#ECECE8]"
          >
            <Star size={14} strokeWidth={1.7} aria-hidden="true" />
            Add to Watchlist
          </Link>
          <Link
            href={instrumentResearchPath(company.symbol)}
            className="flex h-[38px] items-center gap-2 rounded-[10px] bg-[#16191D] px-3.5 text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#1C2027] hover:text-[#ECECE8]"
          >
            Start Research
          </Link>
        </div>
      </div>

      <div className="-mt-1.5 flex gap-7 border-b border-[#16191D]">
        <TabLink href={base} active={tab === "overview"}>
          Overview
        </TabLink>
        <TabLink href={instrumentFinancialsPath(company.symbol)} active={tab === "financials"}>
          Financials
        </TabLink>
        <TabLink href={instrumentValuationPath(company.symbol)} active={tab === "valuation"}>
          Valuation
        </TabLink>
        <TabLink href={instrumentResearchPath(company.symbol)} active={tab === "research"}>
          Research
        </TabLink>
        <TabLink href={instrumentThesisPath(company.symbol)} active={tab === "thesis"}>
          Thesis
        </TabLink>
      </div>
    </>
  );
}

function CompanyMark({ symbol, name }: { symbol: string; name: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    apiBlob(`/api/instruments/${encodeURIComponent(symbol)}/logo`).then((blob) => {
      if (!active || !blob) {
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [symbol]);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-[52px] w-[52px] shrink-0 rounded-[14px] bg-[#191C21] object-contain p-1.5"
      />
    );
  }

  return (
    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#191C21] text-[20px] font-semibold text-[#BDC3CB]">
      {name[0]?.toUpperCase()}
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  if (active) {
    return <span className="-mb-px border-b-2 border-[#8E9CE0] py-3 text-sm font-semibold text-[#ECECE8]">{children}</span>;
  }
  return (
    <Link href={href} className="py-3 text-sm font-medium text-[#8A9199] hover:text-[#ECECE8]">
      {children}
    </Link>
  );
}
