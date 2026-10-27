"use client";

import { InstrumentSearch } from "@/components/app/instrument-search";
import { instrumentResearchPath } from "@/lib/instruments";

export function ResearchHome() {
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-7 px-4 py-14 sm:px-10">
      <div>
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">Research</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          A five-step process: understand the business, review financials, set assumptions, name the risks, then
          decide. Look up a company to start.
        </p>
      </div>
      <InstrumentSearch toPath={instrumentResearchPath} />
    </div>
  );
}
