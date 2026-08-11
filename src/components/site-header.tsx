"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Radar" },
  { href: "/timeline", label: "Discoveries" },
  { href: "/trending", label: "Trending" },
  { href: "/hidden-gems", label: "Hidden Gems" },
  { href: "/trends", label: "Trends" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-[var(--rule-strong)] bg-[var(--paper)]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="group inline-block">
              <p className="font-serif text-3xl font-semibold leading-none tracking-tight text-[var(--ink)] sm:text-4xl">
                GITHUB{" "}
                <span className="relative inline-block">
                  RADAR
                  <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-[var(--signal)]" />
                </span>
              </p>
            </Link>
            <p className="mt-2 font-sans text-sm text-[var(--ink-muted)]">
              Open-source projects worth watching.
            </p>
          </div>
          <form action="/repositories" method="get" className="w-full sm:w-64">
            <input
              type="search"
              name="q"
              placeholder="Search archive…"
              className="w-full border border-[var(--rule-strong)] bg-[var(--paper-elevated)] px-3 py-2 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--signal)]"
            />
          </form>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--rule)] pt-3">
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
                  "font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "text-[var(--signal)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/ahead-of-curve"
            className={cn(
              "ml-auto font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
              pathname.startsWith("/ahead-of-curve")
                ? "text-[var(--signal)]"
                : "text-[var(--ink-faint)] hover:text-[var(--signal)]"
            )}
          >
            Ahead of Curve →
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-[var(--rule-strong)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 font-sans text-xs text-[var(--ink-muted)] sm:flex-row sm:justify-between sm:px-6">
        <p className="font-medium tracking-wide text-[var(--ink)]">GitHub Radar</p>
        <p>Discovery intelligence · Telegram × GitHub</p>
      </div>
    </footer>
  );
}
