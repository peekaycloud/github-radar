"use client";

import Image from "next/image";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="group inline-flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="GitHub Radar — Open-source projects worth watching."
              width={1536}
              height={1024}
              priority
              className="h-14 w-auto border border-[var(--rule-strong)] bg-black sm:h-16"
            />
          </Link>
          <form action="/repositories" method="get" className="w-full sm:w-56">
            <input
              type="search"
              name="q"
              placeholder="Search archive…"
              className="w-full border border-[var(--rule-strong)] bg-[var(--paper-elevated)] px-3 py-1.5 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--signal)]"
            />
          </form>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--rule)] pt-2.5">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 font-sans text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="GitHub Radar"
            width={1536}
            height={1024}
            className="h-8 w-auto border border-[var(--rule)] bg-black"
          />
        </div>
        <p>Discovery intelligence · Telegram × GitHub</p>
      </div>
    </footer>
  );
}
