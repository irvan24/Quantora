import Link from "next/link";
import { CheckIcon } from "@/components/icons";

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden min-w-0 flex-[1_1_46%] flex-col overflow-hidden border-r border-[#15181C] bg-panel px-12 py-10 lg:flex">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <svg viewBox="0 0 520 260" width="520" height="260" className="absolute top-[120px] -left-10 opacity-5" fill="none" stroke="#ECECE8" strokeWidth="1.3">
          <path d="M0 220 C60 212 92 160 150 168 C208 176 236 122 300 132 C360 141 392 96 450 104 C486 109 505 92 520 96" />
        </svg>
        <svg viewBox="0 0 300 160" width="300" height="160" className="absolute right-[-30px] bottom-[120px] opacity-[0.04]" fill="none" stroke="#ECECE8" strokeWidth="1">
          <path d="M0 0v160M75 0v160M150 0v160M225 0v160M300 0v160M0 40h300M0 80h300M0 120h300" />
        </svg>
        <div className="absolute top-[210px] right-14 text-right text-[12.5px] leading-[1.9] text-[#ECECE8] opacity-[0.055]">
          <div>Gross margin</div>
          <div className="text-[26px] font-light">72%</div>
          <div className="mt-[18px]">Assumption</div>
          <div className="text-[15px]">Still holds</div>
        </div>
      </div>

      <Link href="/" className="relative flex items-center gap-2.5 text-[#ECECE8]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#191C21] text-[13px] font-semibold text-link">
          Q
        </span>
        <span className="text-[12.5px] font-semibold tracking-[0.17em]">QUANTORA</span>
      </Link>

      <div className="relative mt-auto max-w-[420px]">
        <h2 className="text-[clamp(28px,3vw,38px)] font-light leading-[1.15] tracking-[-0.03em] text-[#ECECE8]">
          Better thinking.
          <br />
          <span className="font-serif italic text-[#9EABE6]">Better investing.</span>
        </h2>
        <p className="mt-[22px] text-[15px] leading-relaxed text-muted">
          Learn how investing works, research a company, and write down the reason behind every investment.
        </p>
      </div>

      <div className="relative mt-11 flex max-w-[420px] flex-col gap-3">
        {["No trading, no tips, no noise.", "Your plan and your theses stay private.", "Free while you learn."].map((item) => (
          <div key={item} className="flex items-center gap-[11px] text-[13.5px] text-muted">
            <CheckIcon />
            {item}
          </div>
        ))}
      </div>

      <p className="relative mt-auto pt-11 font-serif text-[15px] italic text-faint">
        Better questions lead to better decisions.
      </p>
    </aside>
  );
}
