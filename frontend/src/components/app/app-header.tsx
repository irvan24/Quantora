"use client";

import { Bell, Menu } from "lucide-react";
import { InstrumentSearch } from "@/components/app/instrument-search";
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
        <Menu size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <InstrumentSearch />
      <div className="ml-auto flex items-center gap-[18px]">
        <button
          type="button"
          className="hidden text-dim hover:text-[#ECECE8] sm:flex"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#1A1E26] text-[11.5px] font-semibold tracking-wide text-[#BDC3CB]">
            {initials(user)}
          </div>
          <span className="hidden text-[13.5px] font-medium text-[#BDC3CB] sm:inline">
            {displayName(user)}
          </span>
        </div>
      </div>
    </header>
  );
}
