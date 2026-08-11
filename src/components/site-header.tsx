"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Radar" },
  { href: "/repositories", label: "Repositories" },
  { href: "/trending", label: "Trending" },
  { href: "/hidden-gems", label: "Hidden Gems" },
  { href: "/ahead-of-curve", label: "Ahead of Curve" },
  { href: "/trends", label: "Trends" },
  { href: "/timeline", label: "Timeline" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--rule)] bg-[var(--paper)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="group inline-block">
              <p className="font-serif text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
                GITHUB RADAR
              </p>
            </Link>
            <p className="mt-1 max-w-xl font-sans text-sm text-[var(--ink-muted)]">
              Open-source projects discovered through the community
            </p>
          </div>
          <form action="/repositories" method="get" className="w-full sm:w-64">
            <input
              type="search"
              name="q"
              placeholder="Search repositories…"
              className="w-full border border-[var(--rule)] bg-[var(--paper-elevated)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--ink)]"
            />
          </form>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--rule)] pt-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-sans text-[11px] uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "text-[var(--signal)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--rule)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 font-sans text-xs text-[var(--ink-muted)] sm:flex-row sm:justify-between sm:px-6">
        <p>GitHub Radar — community discovery intelligence</p>
        <p>Telegram channel archive × public GitHub signals</p>
      </div>
    </footer>
  );
}
