"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyFullFinancials } from "@/components/company/company-full-financials";

export default function CompanyFullFinancialsPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";

  return (
    <AppShell>
      <CompanyFullFinancials symbol={symbol} />
    </AppShell>
  );
}
