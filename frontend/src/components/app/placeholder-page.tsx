"use client";

import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";

export default function PlaceholderPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <AppShell>
      <div className="px-10 py-16">
        <h1 className="text-[28px] font-light tracking-tight text-[#ECECE8]">{title}</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{body}</p>
        <Link href="/home" className="mt-8 inline-flex text-sm font-medium text-link hover:text-link-hover">
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
}
