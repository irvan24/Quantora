"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import {
  instrumentPath,
  looksLikeTicker,
  searchInstruments,
  type InstrumentMatch,
} from "@/lib/instruments";

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

export function InstrumentSearch({
  toPath = instrumentPath,
  variant = "default",
  placeholder = "Search a company, ETF or thesis",
  autoFocus = false,
}: {
  toPath?: (symbol: string) => string;
  variant?: "default" | "hero";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstrumentMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      (() => {
        setResults([]);
        setLoading(false);
        setOpen(false);
        setError(null);
      })();
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const matches = await searchInstruments(q, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        setResults(matches);
        setActiveIndex(0);
        setOpen(true);
      } catch (err) {
        if (!isAbortError(err)) {
          setResults([]);
          setError(err instanceof Error ? err.message : "Search failed.");
          setOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function go(symbol: string) {
    router.push(toPath(symbol));
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
    inputRef.current?.blur();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      return;
    }
    const selected = open ? results[activeIndex] : undefined;
    if (selected) {
      go(selected.symbol);
      return;
    }
    const exact = results.find((match) => match.symbol.toUpperCase() === q.toUpperCase());
    if (exact) {
      go(exact.symbol);
      return;
    }
    if (results[0]) {
      go(results[0].symbol);
      return;
    }

    setLoading(true);
    try {
      const matches = await searchInstruments(q);
      setResults(matches);
      setActiveIndex(0);
      if (matches[0]) {
        go(matches[0].symbol);
        return;
      }
      if (looksLikeTicker(q)) {
        go(q);
        return;
      }
      setOpen(true);
    } catch (err) {
      if (!isAbortError(err)) {
        setResults([]);
        setError(err instanceof Error ? err.message : "Search failed.");
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }
  }

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;
  const activeId = showPanel && results[activeIndex] ? `${listId}-${results[activeIndex].symbol}` : undefined;

  const hero = variant === "hero";

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      className={hero ? "relative w-full max-w-[680px]" : "relative min-w-0 max-w-[480px] flex-1"}
    >
      <div
        className={
          hero
            ? "flex h-[58px] items-center gap-3.5 rounded-[14px] bg-input px-5 focus-within:bg-[#14171B] focus-within:ring-4 focus-within:ring-[#8E9CE0]/10"
            : "flex h-[38px] items-center gap-[11px] rounded-[10px] bg-input px-3 focus-within:bg-[#14171B]"
        }
      >
        <SearchIcon className={hero ? "text-dim shrink-0" : "text-dim"} />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0 || query.trim().length >= MIN_QUERY_LENGTH) {
              setOpen(true);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={
            hero
              ? "flex-1 bg-transparent text-[17px] text-[#ECECE8] outline-none placeholder:text-dim"
              : "flex-1 bg-transparent text-[13.5px] text-[#ECECE8] outline-none placeholder:text-dim"
          }
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
        />
        {!hero ? (
          <span className="hidden rounded-[5px] bg-[#191C21] px-1.5 py-0.5 text-[11px] text-dim sm:inline">⌘K</span>
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-[340px] w-full overflow-auto rounded-[12px] border border-[#1A1E24] bg-[#111316] py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        >
          {loading && results.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[13px] text-[#6C727B]">Searching…</li>
          ) : error && results.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[13px] text-[#6C727B]">{error}</li>
          ) : results.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[13px] text-[#6C727B]">No company matches that name.</li>
          ) : (
            results.map((match, index) => {
              const active = index === activeIndex;
              return (
                <li key={match.symbol} role="option" id={`${listId}-${match.symbol}`} aria-selected={active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(match.symbol)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${active ? "bg-[#191C21]" : ""}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#191C21] text-[12px] font-semibold text-[#BDC3CB]">
                      {match.name[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-[#ECECE8]">
                        <Highlight text={match.name} query={query} />
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[#6C727B]">
                        {match.exchange ? `${match.exchange} · ` : ""}
                        <Highlight text={match.symbol} query={query} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </form>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) {
    return text;
  }
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <span className="text-link">{text.slice(index, index + needle.length)}</span>
      {text.slice(index + needle.length)}
    </>
  );
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}
