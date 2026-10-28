"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getInstrument,
  instrumentFinancialsPath,
  instrumentPath,
  instrumentResearchPath,
  instrumentThesisPath,
  instrumentValuationPath,
  type CompanyProfile,
} from "@/lib/instruments";
import { listResearchVisits, type CompanyVisit } from "@/lib/research";
import { getThesisSummary, listTheses, type Thesis, type ThesisSummary } from "@/lib/theses";
import { addToWatchlist, listWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";

/** Number of filled stage segments out of 5 (Overview, Financials, Valuation, Research, Thesis). */
export type StageProgress = 0 | 1 | 2 | 3 | 4 | 5;

export type WorkspaceCompany = {
  symbol: string;
  name: string;
  sector: string | null;
  initial: string;
  profileFailed: boolean;
  stageFilled: StageProgress;
  stageLabel: string;
  hasThesis: boolean;
  thesis: Thesis | null;
  onWatchlist: boolean;
  watchlistedAt: string | null;
  lastActivity: string | null;
  viewCount: number;
  nextHref: string;
};

export type ResearchWorkspace = {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  companies: WorkspaceCompany[];
  watchlist: WorkspaceCompany[];
  continueCards: WorkspaceCompany[];
  discover: WorkspaceCompany[];
  stats: { researched: number; activeTheses: number; needingReview: number; onWatchlist: number };
  toggleWatchlist: (symbol: string) => Promise<void>;
  watchlistError: string | null;
  dismissWatchlistError: () => void;
  reload: () => void;
};

const STAGE_LABELS = ["Not started", "Exploring", "Financials reviewed", "Valuation reviewed", "Research in progress"];

export function useResearchWorkspace(): ResearchWorkspace {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [visits, setVisits] = useState<CompanyVisit[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [summary, setSummary] = useState<ThesisSummary>({ count: 0, needingReview: 0 });
  const [profiles, setProfiles] = useState<Map<string, CompanyProfile | null>>(new Map());
  const [version, setVersion] = useState(0);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const dismissWatchlistError = useCallback(() => setWatchlistError(null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [watchlistItems, visitItems, thesisItems, thesisSummary] = await Promise.all([
          listWatchlist(),
          listResearchVisits(),
          listTheses(),
          getThesisSummary(),
        ]);
        if (cancelled) {
          return;
        }
        setWatchlist(watchlistItems);
        setVisits(visitItems);
        setTheses(thesisItems);
        setSummary(thesisSummary);

        const symbols = new Set<string>();
        watchlistItems.forEach((item) => symbols.add(item.symbol));
        visitItems.forEach((item) => symbols.add(item.symbol));
        thesisItems.forEach((item) => {
          if (item.symbol) {
            symbols.add(item.symbol.toUpperCase());
          }
        });

        const entries = await Promise.all(
          Array.from(symbols).map(async (symbol) => {
            try {
              return [symbol, await getInstrument(symbol)] as const;
            } catch {
              return [symbol, null] as const;
            }
          })
        );
        if (!cancelled) {
          setProfiles(new Map(entries));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your research workspace.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const companies = buildCompanies(watchlist, visits, theses, profiles);
  const watchlistCompanies = watchlist
    .map((item) => companies.find((c) => c.symbol === item.symbol))
    .filter((c): c is WorkspaceCompany => Boolean(c));

  const continueCards = companies
    .filter((c) => !c.hasThesis && c.lastActivity)
    .sort((a, b) => timeValue(b.lastActivity) - timeValue(a.lastActivity))
    .slice(0, 4);

  const continueSymbols = new Set(continueCards.map((c) => c.symbol));
  const discover = companies
    .filter((c) => !c.onWatchlist && c.lastActivity && !continueSymbols.has(c.symbol))
    .sort((a, b) => timeValue(b.lastActivity) - timeValue(a.lastActivity))
    .slice(0, 8);

  async function toggleWatchlist(symbol: string) {
    const upper = symbol.trim().toUpperCase();
    const isWatching = watchlist.some((item) => item.symbol === upper);
    const previous = watchlist;
    setWatchlistError(null);
    try {
      if (isWatching) {
        setWatchlist((prev) => prev.filter((item) => item.symbol !== upper));
        await removeFromWatchlist(upper);
      } else {
        const optimistic = { symbol: upper, addedAt: new Date().toISOString() };
        setWatchlist((prev) => [optimistic, ...prev]);
        const saved = await addToWatchlist(upper);
        setWatchlist((prev) => prev.map((item) => (item.symbol === upper ? saved : item)));
      }
    } catch (err) {
      // Roll back the optimistic change so the list on screen matches the server again.
      setWatchlist(previous);
      setWatchlistError(err instanceof Error ? err.message : "Could not update your watchlist.");
    }
  }

  return {
    loading,
    error,
    isEmpty: watchlist.length === 0 && visits.length === 0 && theses.length === 0,
    companies,
    watchlist: watchlistCompanies,
    continueCards,
    discover,
    stats: {
      researched: visits.length,
      activeTheses: summary.count,
      needingReview: summary.needingReview,
      onWatchlist: watchlist.length,
    },
    toggleWatchlist,
    watchlistError,
    dismissWatchlistError,
    reload,
  };
}

function buildCompanies(
  watchlist: WatchlistItem[],
  visits: CompanyVisit[],
  theses: Thesis[],
  profiles: Map<string, CompanyProfile | null>
): WorkspaceCompany[] {
  const symbols = new Set<string>();
  watchlist.forEach((item) => symbols.add(item.symbol));
  visits.forEach((item) => symbols.add(item.symbol));
  theses.forEach((item) => {
    if (item.symbol) {
      symbols.add(item.symbol.toUpperCase());
    }
  });

  return Array.from(symbols).map((symbol) => {
    const profile = profiles.get(symbol) ?? null;
    const visit = visits.find((item) => item.symbol === symbol) ?? null;
    const thesis = theses.find((item) => item.symbol?.toUpperCase() === symbol) ?? null;
    const watchlistItem = watchlist.find((item) => item.symbol === symbol) ?? null;

    const stageFilled: StageProgress = thesis ? 5 : visit ? ((visit.maxSectionRank + 1) as StageProgress) : 0;
    const stageLabel = thesis ? "Thesis written" : STAGE_LABELS[visit ? visit.maxSectionRank + 1 : 0];

    const lastActivity = latest([visit?.lastViewedAt, thesis?.updatedAt ?? thesis?.createdAt, watchlistItem?.addedAt]);

    const name = profile?.name ?? symbol;

    return {
      symbol,
      name,
      sector: profile?.sector ?? null,
      initial: name.charAt(0).toUpperCase(),
      profileFailed: profiles.has(symbol) && profile === null,
      stageFilled,
      stageLabel,
      hasThesis: Boolean(thesis),
      thesis,
      onWatchlist: Boolean(watchlistItem),
      watchlistedAt: watchlistItem?.addedAt ?? null,
      lastActivity,
      viewCount: visit?.viewCount ?? 0,
      nextHref: nextStepPath(symbol, stageFilled),
    };
  });
}

function nextStepPath(symbol: string, stageFilled: StageProgress) {
  switch (stageFilled) {
    case 0:
      return instrumentPath(symbol);
    case 1:
      return instrumentFinancialsPath(symbol);
    case 2:
      return instrumentValuationPath(symbol);
    case 3:
      return instrumentResearchPath(symbol);
    default:
      return instrumentThesisPath(symbol);
  }
}

function latest(values: (string | null | undefined)[]) {
  const times = values.filter((v): v is string => Boolean(v)).map((v) => new Date(v).getTime());
  if (times.length === 0) {
    return null;
  }
  return new Date(Math.max(...times)).toISOString();
}

function timeValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}
