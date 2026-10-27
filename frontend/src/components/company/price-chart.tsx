"use client";

import { useMemo, useState } from "react";
import { formatPrice, type PricePoint } from "@/lib/instruments";

const PERIODS = ["1M", "6M", "YTD", "1Y", "5Y"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABEL: Record<Period, string> = {
  "1M": "past month",
  "6M": "past 6 months",
  YTD: "year to date",
  "1Y": "past year",
  "5Y": "past 5 years",
};

function filterPoints(points: PricePoint[], period: Period) {
  if (points.length === 0) {
    return [];
  }
  const last = new Date(points[points.length - 1].date);
  const from = new Date(last);
  if (period === "1M") {
    from.setMonth(from.getMonth() - 1);
  } else if (period === "6M") {
    from.setMonth(from.getMonth() - 6);
  } else if (period === "YTD") {
    from.setMonth(0, 1);
  } else if (period === "1Y") {
    from.setFullYear(from.getFullYear() - 1);
  } else {
    from.setFullYear(from.getFullYear() - 5);
  }
  const fromKey = from.toISOString().slice(0, 10);
  const filtered = points.filter((point) => point.date >= fromKey);
  return filtered.length > 1 ? filtered : points;
}

function pathFor(points: PricePoint[]) {
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const top = 20;
  const bot = 260;
  const line = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 1000;
      const y = bot - ((point.close - min) / span) * (bot - top);
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return { line, area: `${line} L1000 280 L0 280 Z`, min, max };
}

function formatAxisDate(value: string, period: Period) {
  const date = new Date(`${value}T00:00:00`);
  if (period === "5Y") {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "1Y" || period === "YTD" ? "numeric" : undefined });
}

export function PriceChart({ points, currency }: { points: PricePoint[]; currency: string }) {
  const [period, setPeriod] = useState<Period>("1Y");
  const [hover, setHover] = useState<number | null>(null);

  const series = useMemo(() => filterPoints(points, period), [points, period]);
  const geometry = useMemo(() => (series.length > 1 ? pathFor(series) : null), [series]);

  if (!geometry) {
    return null;
  }

  const change = series[series.length - 1].close / series[0].close - 1;
  const labels = [0, 0.25, 0.5, 0.75, 1].map((t) => series[Math.round(t * (series.length - 1))].date);
  const hoverX = hover != null ? (hover / (series.length - 1)) * 100 : 0;
  const hoverClose = hover != null ? series[hover].close : null;
  const hoverY =
    hoverClose == null
      ? 0
      : 260 - ((hoverClose - geometry.min) / (geometry.max - geometry.min || 1)) * 240;

  return (
    <section className="flex min-w-0 flex-[2_1_560px] flex-col gap-4 rounded-2xl bg-card px-[26px] pt-[22px] pb-[18px]">
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-[15px] font-semibold text-[#ECECE8]">Price history</h3>
          <span className={`text-[13px] font-medium ${change >= 0 ? "text-[#56A177]" : "text-[#C1605A]"}`}>
            {`${change >= 0 ? "+" : ""}${(change * 100).toFixed(2)}%`}
          </span>
          <span className="text-[12.5px] text-[#6C727B]">{PERIOD_LABEL[period]}</span>
        </div>
        <div className="ml-auto flex gap-0.5 rounded-[9px] bg-[#0E1013] p-[3px]">
          {PERIODS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPeriod(key);
                setHover(null);
              }}
              className={`h-7 min-w-[38px] rounded-[7px] px-2.5 text-[12.5px] ${
                key === period ? "bg-[#1B1F25] font-semibold text-[#ECECE8]" : "font-medium text-[#7C828B] hover:text-[#ECECE8]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative h-[280px] cursor-crosshair"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const index = Math.max(
            0,
            Math.min(series.length - 1, Math.round(((event.clientX - rect.left) / rect.width) * (series.length - 1)))
          );
          setHover(index);
        }}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 1000 280" preserveAspectRatio="none" width="100%" height="280" className="block overflow-visible">
          <defs>
            <linearGradient id="qArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8E9CE0" stopOpacity="0.16" />
              <stop offset="1" stopColor="#8E9CE0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" x2="1000" y1="20" y2="20" stroke="#191C20" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="1000" y1="140" y2="140" stroke="#191C20" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="1000" y1="260" y2="260" stroke="#191C20" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={geometry.area} fill="url(#qArea)" />
          <path d={geometry.line} fill="none" stroke="#8E9CE0" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="pointer-events-none absolute right-0 top-1 text-[11.5px] text-[#6C727B]">
          {formatPrice(geometry.max, currency)}
        </div>
        <div className="pointer-events-none absolute right-0 top-[124px] text-[11.5px] text-[#6C727B]">
          {formatPrice((geometry.max + geometry.min) / 2, currency)}
        </div>
        <div className="pointer-events-none absolute right-0 top-[244px] text-[11.5px] text-[#6C727B]">
          {formatPrice(geometry.min, currency)}
        </div>
        {hover != null && hoverClose != null ? (
          <>
            <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#2A2F37]" style={{ left: `${hoverX}%` }} />
            <div
              className="pointer-events-none absolute h-2 w-2 rounded-full bg-[#8E9CE0] shadow-[0_0_0_3px_#111316]"
              style={{ left: `calc(${hoverX}% - 4px)`, top: `${hoverY - 4}px` }}
            />
            <div
              className="pointer-events-none absolute rounded-lg bg-[#1A1D22] px-[11px] py-2"
              style={hoverX > 80 ? { right: `${100 - hoverX}%`, marginRight: 12, top: -4 } : { left: `calc(${hoverX}% + 12px)`, top: -4 }}
            >
              <div className="text-[13.5px] font-semibold text-[#ECECE8]">{formatPrice(hoverClose, currency)}</div>
              <div className="mt-0.5 whitespace-nowrap text-[11.5px] text-[#8A9199]">{formatAxisDate(series[hover].date, period)}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex justify-between pr-11 text-[11.5px] text-[#6C727B]">
        {labels.map((label) => (
          <span key={label}>{formatAxisDate(label, period)}</span>
        ))}
      </div>
    </section>
  );
}
