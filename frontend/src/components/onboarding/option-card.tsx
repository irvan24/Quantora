"use client";

type OptionCardProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  check?: boolean;
  compact?: boolean;
  muted?: boolean;
  className?: string;
};

export function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  check = false,
  compact = false,
  muted = false,
  className = "",
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full cursor-pointer rounded-xl border border-[#292D33] bg-[#14171B] text-left hover:border-[#3A3F47] ${
        compact ? "px-[18px] py-[15px]" : "px-[18px] py-4"
      } ${className}`}
    >
      <div className={`font-semibold ${muted ? "text-[#949BA5]" : "text-[#F2F3F5]"} ${subtitle ? "text-[15.5px]" : "text-[15px]"}`}>
        {title}
      </div>
      {subtitle ? <div className="mt-1 text-[13.5px] text-[#949BA5]">{subtitle}</div> : null}
      {selected ? (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-xl border-[1.5px] border-[#7C8CF8] bg-[rgba(124,140,248,0.06)]" />
          {check ? (
            <span className="absolute top-4 right-4 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#7C8CF8]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0D0F12" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12.5 9.5 18 20 6.5" />
              </svg>
            </span>
          ) : null}
        </>
      ) : null}
    </button>
  );
}

export function OptionChip({
  selected,
  onClick,
  label,
  muted = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative cursor-pointer rounded-full border border-[#292D33] bg-[#14171B] px-[18px] py-2.5 text-sm hover:border-[#3A3F47] ${
        muted ? "text-[#949BA5]" : "text-[#F2F3F5]"
      }`}
    >
      {label}
      {selected ? (
        <span className="pointer-events-none absolute inset-0 rounded-full border-[1.5px] border-[#7C8CF8] bg-[rgba(124,140,248,0.08)]" />
      ) : null}
    </button>
  );
}
