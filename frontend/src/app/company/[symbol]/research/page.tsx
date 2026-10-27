"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyResearch } from "@/components/company/company-research";

export default function CompanyResearchPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";

  return (
    <AppShell>
      <CompanyResearch symbol={symbol} />
    </AppShell>
  );
}
