"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyOverview } from "@/components/company/company-overview";
import { useRecordResearchVisit } from "@/lib/research";

export default function CompanyPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";
  useRecordResearchVisit(symbol, "OVERVIEW");

  return (
    <AppShell>
      <CompanyOverview symbol={symbol} />
    </AppShell>
  );
}
