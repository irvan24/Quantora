"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparkleIcon } from "@/components/icons";

type AppSidebarProps = {
  onAsk: () => void;
  onClose?: () => void;
};

const navClass = (active: boolean) =>
  `flex items-center gap-3 rounded-[9px] px-[11px] py-[9px] text-sm ${
    active
      ? "bg-[#171A1F] font-semibold text-[#ECECE8]"
      : "font-normal text-muted hover:bg-[#141719] hover:text-[#ECECE8]"
  }`;

export function AppSidebar({ onAsk, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-screen w-[242px] shrink-0 flex-col gap-[26px] border-r border-[#16191D] bg-panel px-4 py-7">
      <div className="flex items-center gap-[11px] px-2">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#191C21] text-[15px] font-semibold text-[#ECECE8]">
          Q
        </div>
        <div className="text-[13px] font-semibold tracking-[0.16em] text-[#ECECE8]">QUANTORA</div>
      </div>

      <nav className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-0.5">
          <Link href="/home" onClick={onClose} className={navClass(pathname === "/home")}>
            <HomeIcon active={pathname === "/home"} />
            Home
          </Link>
        </div>

        <NavGroup label="Your journey">
          <NavItem href="/plan" label="My Plan" icon={<PlanIcon />} onClick={onClose} />
          <NavItem href="/learn" label="Learn" icon={<LearnIcon />} onClick={onClose} />
        </NavGroup>

        <NavGroup label="Invest">
          <NavItem href="/research" label="Research" icon={<ResearchIcon />} onClick={onClose} />
          <NavItem href="/watchlist" label="Watchlist" icon={<WatchlistIcon />} onClick={onClose} />
          <NavItem href="/portfolio" label="Portfolio" icon={<PortfolioIcon />} onClick={onClose} />
        </NavGroup>

        <NavGroup label="Reflect">
          <NavItem href="/theses" label="Theses" icon={<ThesesIcon />} onClick={onClose} />
          <NavItem href="/journal" label="Journal" icon={<JournalIcon />} onClick={onClose} />
        </NavGroup>
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button
          type="button"
          onClick={onAsk}
          className="flex items-center gap-[11px] rounded-[9px] bg-[#14171B] px-[11px] py-2.5 text-left text-[13.5px] font-medium text-[#BDC3CB] hover:bg-[#191C21] hover:text-[#ECECE8]"
        >
          <SparkleIcon />
          Ask Quantora
        </button>
        <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-[11px] text-[13.5px] text-dim hover:text-[#ECECE8]">
          <SettingsIcon />
          Settings
        </Link>
        <div className="px-[11px] text-xs leading-[1.55] text-dim">
          Better thinking.
          <br />
          Better investing.
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-[11px] pb-[7px] text-[10.5px] font-semibold tracking-[0.16em] text-[#4E545C] uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={navClass(false)}>
      {icon}
      {label}
    </Link>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#8E9CE0" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V21h14V9.8" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18.5V6.2a2 2 0 0 1 1.5-1.9l5-1.1 8 2v12.4l-8-2-5 1.1" />
      <path d="M10.5 3.2v14.4" />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5H11v15H5.5a2 2 0 0 0-2 2z" />
      <path d="M20.5 6.5a2 2 0 0 0-2-2H13v15h5.5a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ResearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function WatchlistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.8l2.5 5.3 5.7.8-4.1 4 1 5.6L12 16.9 6.9 19.5l1-5.6-4.1-4 5.7-.8z" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12V3M12 12l7.5 4.5" />
    </svg>
  );
}

function ThesesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 3.5h11v17l-5.5-3-5.5 3z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </svg>
  );
}
