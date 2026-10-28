import { api } from "@/lib/auth";

export type WatchlistItem = {
  symbol: string;
  addedAt: string;
};

export async function listWatchlist() {
  return api<WatchlistItem[]>("/api/watchlist");
}

export async function addToWatchlist(symbol: string) {
  return api<WatchlistItem>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ symbol }),
  });
}

export async function removeFromWatchlist(symbol: string) {
  return api<void>(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" });
}
