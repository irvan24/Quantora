"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyFinancials } from "@/components/company/company-financials";

export default function CompanyFinancialsPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";

  return (
    <AppShell>
      <CompanyFinancials symbol={symbol} />
    </AppShell>
  );
}
