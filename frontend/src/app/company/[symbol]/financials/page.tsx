"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyFinancials } from "@/components/company/company-financials";
import { useRecordResearchVisit } from "@/lib/research";

export default function CompanyFinancialsPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";
  useRecordResearchVisit(symbol, "FINANCIALS");

  return (
    <AppShell>
      <CompanyFinancials symbol={symbol} />
    </AppShell>
  );
}
