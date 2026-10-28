"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyValuation } from "@/components/company/company-valuation";
import { useRecordResearchVisit } from "@/lib/research";

export default function CompanyValuationPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";
  useRecordResearchVisit(symbol, "VALUATION");

  return (
    <AppShell>
      <CompanyValuation symbol={symbol} />
    </AppShell>
  );
}
