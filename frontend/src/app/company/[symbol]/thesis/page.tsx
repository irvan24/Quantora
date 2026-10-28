"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { CompanyThesis } from "@/components/company/company-thesis";

export default function CompanyThesisPage() {
  const params = useParams();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";

  return (
    <AppShell>
      <CompanyThesis symbol={symbol} />
    </AppShell>
  );
}
