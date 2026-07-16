"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PullToRefresh } from "@/components/app/pull-to-refresh";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Icon paths mirror the handoff prototype exactly.
function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  );
}
function ProfileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
    </svg>
  );
}
function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/library",
    label: "Hjem",
    Icon: HomeIcon,
    match: (p) => p === "/library" || p.startsWith("/recipes"),
  },
  {
    href: "/search",
    label: "Søk",
    Icon: SearchIcon,
    match: (p) => p.startsWith("/search"),
  },
  {
    href: "/books",
    label: "Boken",
    Icon: BookIcon,
    match: (p) => p.startsWith("/books"),
  },
  {
    href: "/account",
    label: "Profil",
    Icon: ProfileIcon,
    match: (p) => p.startsWith("/account") || p.startsWith("/invites"),
  },
];

export function AppShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initial = (email?.trim()[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-papir">
      {/* Quiet top chrome — the Papir ground shows through; content scrolls under. */}
      <header
        className="app-chrome sticky top-0 z-40"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link
            href="/library"
            className="tap text-xs font-medium uppercase tracking-[0.34em] text-ink"
            aria-label="Arv — hjem"
          >
            ARV
          </Link>
          <Link
            href="/account"
            aria-label="Profil"
            className="tap flex h-8 w-8 items-center justify-center bg-salvie text-xs font-medium text-gran"
          >
            {initial}
          </Link>
        </div>
      </header>

      {/* Content — pure Papir ground, room for the floating nav. */}
      <main
        className="scroll-y mx-auto max-w-5xl px-5 pt-6 sm:px-6"
        style={{ paddingBottom: "calc(96px + var(--safe-bottom))" }}
      >
        <PullToRefresh>
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </PullToRefresh>
      </main>

      {/* Floating bottom nav — translucent Papir material, Gran only for the
          active tab and the raised import button. */}
      <nav
        className="nav-float fixed left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between px-6 py-2.5"
        style={{ bottom: "calc(20px + var(--safe-bottom))", borderRadius: "22px" }}
        aria-label="Hovedmeny"
      >
        <NavItem tab={TABS[0]} active={TABS[0].match(pathname)} />
        <NavItem tab={TABS[1]} active={TABS[1].match(pathname)} />

        {/* Raised import FAB — the one Gran-filled action, 15px radius. */}
        <Link
          href="/import"
          aria-label="Importer oppskrift"
          onClick={tapHaptic}
          className="tap -mt-6 flex h-[46px] w-[46px] items-center justify-center bg-gran text-snow"
          style={{
            borderRadius: "15px",
            boxShadow: "0 10px 22px -8px rgba(73,96,79,0.5)",
          }}
        >
          <PlusIcon className="h-5 w-5" />
        </Link>

        <NavItem tab={TABS[2]} active={TABS[2].match(pathname)} />
        <NavItem tab={TABS[3]} active={TABS[3].match(pathname)} />
      </nav>
    </div>
  );
}

function NavItem({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      onClick={tapHaptic}
      className={cn(
        "tap flex flex-col items-center gap-1 px-2.5 py-1 transition-colors duration-150",
        active ? "text-gran" : "text-stone",
      )}
    >
      <tab.Icon className="h-[22px] w-[22px]" />
      <span className="text-[8.5px] font-medium uppercase tracking-[0.12em]">
        {tab.label}
      </span>
    </Link>
  );
}
