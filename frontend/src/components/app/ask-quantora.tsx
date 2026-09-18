"use client";

import { SparkleIcon } from "@/components/icons";

const prompts = [
  "What is an investment thesis?",
  "Where should a beginner start?",
  "Explain my plan back to me",
];

export function AskQuantora({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-40 w-[min(380px,calc(100vw-32px))] rounded-[14px] bg-[#171A20] p-[18px] shadow-[0_18px_44px_rgba(0,0,0,.5)]">
      <div className="flex items-center gap-2.5">
        <SparkleIcon />
        <span className="text-[13.5px] font-semibold text-[#ECECE8]">Ask Quantora</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-base leading-none text-dim hover:text-[#ECECE8]"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-[9px] bg-[#1B1F25] px-3 py-2.5 text-left text-[13.5px] text-[#DDDDD8] hover:bg-[#20242B] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-3.5 flex h-10 items-center gap-2.5 rounded-[10px] bg-[#0E1013] px-3">
        <input
          type="text"
          placeholder="Ask anything — nothing is too basic"
          className="flex-1 bg-transparent text-[13.5px] text-[#ECECE8] outline-none placeholder:text-dim"
        />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5B6ACB" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />
        </svg>
      </div>
    </div>
  );
}
