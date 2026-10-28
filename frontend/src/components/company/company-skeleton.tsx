const TABS = ["Overview", "Financials", "Valuation", "Research", "Thesis"];

/**
 * Shared loading placeholder for every company tab (Overview, Financials, Valuation,
 * Research, Thesis). The identity header shape is identical across all five, so one
 * skeleton covers them instead of duplicating the same blocks five times.
 */
export function CompanySkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1320px] animate-pulse flex-col gap-7 px-4 pb-12 pt-3 sm:px-10"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <div className="flex min-w-0 flex-[1_1_360px] items-center gap-[18px]">
          <div className="h-[52px] w-[52px] shrink-0 rounded-[14px] bg-card" />
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="h-6 w-48 rounded bg-card" />
            <div className="h-3.5 w-64 max-w-full rounded bg-card" />
          </div>
        </div>
        <div className="h-9 w-24 rounded bg-card" />
        <div className="flex items-center gap-2">
          <div className="h-[38px] w-[150px] rounded-[10px] bg-card" />
          <div className="h-[38px] w-[130px] rounded-[10px] bg-card" />
        </div>
      </div>

      <div className="flex gap-7 border-b border-[#16191D] pb-3">
        {TABS.map((tab) => (
          <div key={tab} className="h-4 w-16 rounded bg-card" />
        ))}
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <div className="h-[280px] flex-[2_1_480px] rounded-2xl bg-card" />
        <div className="h-[280px] flex-[1_1_320px] rounded-2xl bg-card" />
      </div>

      <div className="h-[160px] rounded-2xl bg-card" />
    </div>
  );
}
