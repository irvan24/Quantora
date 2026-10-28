"use client";

import { useEffect } from "react";
import { api } from "@/lib/auth";

export type ResearchSection = "OVERVIEW" | "FINANCIALS" | "VALUATION" | "RESEARCH";

export type CompanyVisit = {
  symbol: string;
  maxSectionRank: number;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
};

export const RESEARCH_SECTIONS: ResearchSection[] = ["OVERVIEW", "FINANCIALS", "VALUATION", "RESEARCH"];

export async function listResearchVisits() {
  return api<CompanyVisit[]>("/api/research/visits");
}

export async function recordResearchVisit(symbol: string, section: ResearchSection) {
  return api<CompanyVisit>("/api/research/visits", {
    method: "POST",
    body: JSON.stringify({ symbol, section }),
  });
}

/**
 * Fire-and-forget: a missed visit only means slightly stale "continue your research"
 * data, so a network failure here must never block or break the company page.
 */
export function useRecordResearchVisit(symbol: string, section: ResearchSection) {
  useEffect(() => {
    if (!symbol) {
      return;
    }
    recordResearchVisit(symbol, section).catch(() => {});
  }, [symbol, section]);
}

export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "Just now";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "An hour ago" : `${hours} hours ago`;
  }
  const days = Math.round(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}
