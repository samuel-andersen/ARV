"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { PullToRefresh } from "@/components/app/pull-to-refresh";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </svg>
  );
}
function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M12 6.5C10.4 5.3 8 4.8 6 4.8s-3.5.4-3.5.4v13s1.5-.4 3.5-.4 4 .5 6 1.7c2-1.2 4-1.7 6-1.7s3.5.4 3.5.4v-13S20 4.8 18 4.8s-4.4.5-6 1.7z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}
function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={1.9}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}
function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M3.5 7.5l8.5 5.5 8.5-5.5" />
    </svg>
  );
}
function PersonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20c0-3.9 3.4-5.8 7.5-5.8s7.5 1.9 7.5 5.8" />
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
  center?: boolean;
}

const TABS: Tab[] = [
  { href: "/library", label: "Library", Icon: GridIcon },
  { href: "/books", label: "Books", Icon: BookIcon },
  { href: "/import", label: "Import", Icon: PlusIcon, center: true },
  { href: "/invites", label: "Invites", Icon: MailIcon },
  { href: "/account", label: "You", Icon: PersonIcon },
];

// Desktop header uses the same destinations minus the center emphasis.
const NAV = TABS.filter((t) => !t.center);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-mist">
      {/* Header — Gran brand chrome */}
      <header
        className="chrome-gran sticky top-0 z-40 border-b border-white/10"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/library" className="tap text-base font-medium tracking-tight text-snow">
            Arv
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-sm sm:flex">
            {NAV.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "font-light transition-colors duration-150",
                  isActive(pathname, t.href) ? "text-snow" : "text-snow/65 hover:text-snow",
                )}
              >
                {t.label}
              </Link>
            ))}
            <Link
              href="/import"
              className={cn(
                "font-light transition-colors duration-150",
                isActive(pathname, "/import") ? "text-snow" : "text-snow/65 hover:text-snow",
              )}
            >
              Import
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-snow/60 hover:text-snow"
                title={email ?? undefined}
              >
                Sign out
              </button>
            </form>
          </nav>

          {/* Mobile: brand only in header; nav lives in the bottom bar. */}
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-snow/60 sm:hidden">
            arv.kitchen
          </span>
        </div>
      </header>

      {/* Content — leaves room for the mobile tab bar. */}
      <main
        className="scroll-y mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10"
        style={{
          paddingBottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 24px)",
        }}
      >
        <PullToRefresh>
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </PullToRefresh>
      </main>

      {/* Bottom tab bar — Gran chrome, mobile only */}
      <nav
        className="chrome-gran fixed inset-x-0 bottom-0 z-40 border-t border-white/10 sm:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            if (t.center) {
              return (
                <li key={t.href} className="flex items-center">
                  <Link
                    href={t.href}
                    aria-label={t.label}
                    className="tap -mt-6 flex h-14 w-14 items-center justify-center bg-snow text-gran shadow-[0_10px_22px_-8px_rgba(20,20,19,0.45)]"
                  >
                    <t.Icon className="h-6 w-6" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap flex h-full flex-col items-center justify-center gap-1 transition-colors duration-150",
                    active ? "text-snow" : "text-snow/55",
                  )}
                >
                  <t.Icon className="h-[22px] w-[22px]" />
                  <span className="text-[10px] tracking-[0.02em]">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
