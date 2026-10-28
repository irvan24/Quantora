"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  BookOpen,
  FileText,
  House,
  Map,
  PieChart,
  Search,
  Settings,
  Star,
  type LucideIcon,
} from "lucide-react";
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
            <NavIcon icon={House} active={pathname === "/home"} />
            Home
          </Link>
        </div>

        <NavGroup label="Your journey">
          <NavItem href="/plan" label="My Plan" icon={Map} onClick={onClose} />
          <NavItem href="/learn" label="Learn" icon={BookOpen} onClick={onClose} />
        </NavGroup>

        <NavGroup label="Invest">
          <NavItem href="/research" label="Research" icon={Search} onClick={onClose} />
          <NavItem href="/watchlist" label="Watchlist" icon={Star} onClick={onClose} />
          <NavItem href="/portfolio" label="Portfolio" icon={PieChart} onClick={onClose} />
        </NavGroup>

        <NavGroup label="Reflect">
          <NavItem href="/theses" label="Theses" icon={FileText} onClick={onClose} />
          <NavItem href="/journal" label="Journal" icon={Bookmark} onClick={onClose} />
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
          <Settings size={15} strokeWidth={1.7} aria-hidden="true" />
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
  icon: LucideIcon;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/plan" ? pathname.startsWith("/plan") : pathname === href;
  return (
    <Link href={href} onClick={onClick} className={navClass(active)}>
      <NavIcon icon={icon} active={active} />
      {label}
    </Link>
  );
}

function NavIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  return <Icon size={16} strokeWidth={1.7} color={active ? "#8E9CE0" : "currentColor"} aria-hidden="true" />;
}
