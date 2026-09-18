"use client";

import { SearchIcon } from "@/components/icons";
import { type AuthUser, displayName, initials } from "@/lib/auth";

type AppHeaderProps = {
  user: AuthUser;
  onMenu: () => void;
};

export function AppHeader({ user, onMenu }: AppHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-line px-4 py-[18px] sm:gap-6 sm:px-10">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-dim hover:text-[#ECECE8] lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <label className="flex h-[38px] max-w-[480px] flex-1 items-center gap-[11px] rounded-[10px] bg-input px-3 focus-within:bg-[#14171B]">
        <SearchIcon className="text-dim" />
        <input
          type="search"
          placeholder="Search a company or an ETF to look at"
          className="flex-1 bg-transparent text-[13.5px] text-[#ECECE8] outline-none placeholder:text-dim"
        />
        <span className="hidden rounded-[5px] bg-[#191C21] px-1.5 py-0.5 text-[11px] text-dim sm:inline">⌘K</span>
      </label>
      <div className="ml-auto flex items-center gap-[18px]">
        <button type="button" className="hidden text-dim hover:text-[#ECECE8] sm:flex" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" />
            <path d="M10.2 19a2 2 0 0 0 3.6 0" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#1A1E26] text-[11.5px] font-semibold tracking-wide text-[#BDC3CB]">
            {initials(user)}
          </div>
          <span className="hidden text-[13.5px] font-medium text-[#BDC3CB] sm:inline">{displayName(user)}</span>
        </div>
      </div>
    </header>
  );
}
