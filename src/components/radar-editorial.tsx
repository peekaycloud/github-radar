import Link from "next/link";
import type { DiscoveryRow } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/queries";
import { buildWhyItMatters, signalLevel } from "@/lib/signals";

export function EditorialRadarCard({
  repo,
  index,
}: {
  repo: DiscoveryRow;
  index: number;
}) {
  const name = repo.full_name || `${repo.owner}/${repo.repo_name}`;
  const href = `/repo/${repo.owner}/${repo.repo_name}`;
  const signals = buildWhyItMatters(repo);
  const level = signalLevel(repo);
  const growth =
    repo.stars_pct_growth_30d ?? repo.stars_pct_growth_7d ?? null;

  return (
    <article className="border-b border-[var(--rule)] py-8 first:pt-2 last:border-b-0">
      <div className="grid gap-6 lg:grid-cols-[3rem_1fr_14rem]">
        <p className="font-mono text-sm font-medium text-[var(--signal)]">
          {String(index).padStart(2, "0")}
        </p>

        <div className="min-w-0">
          <Link
            href={href}
            className="font-serif text-2xl font-semibold tracking-tight text-[var(--ink)] decoration-[var(--signal)] underline-offset-4 hover:underline sm:text-3xl"
          >
            {name}
          </Link>
          {repo.description ? (
            <p className="mt-3 max-w-2xl font-serif text-lg leading-snug text-[var(--ink-muted)]">
              {repo.description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-xs tabular-nums text-[var(--ink)]">
            <span className="text-base font-medium">★ {formatNumber(repo.stars)}</span>
            {repo.forks != null ? <span>⑂ {formatNumber(repo.forks)}</span> : null}
            {repo.language ? <span className="text-[var(--ink-faint)]">{repo.language}</span> : null}
            {growth != null && growth !== 0 ? (
              <span className="text-[var(--signal)]">
                {growth > 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(0)}% /{" "}
                {repo.stars_pct_growth_30d != null ? "30 days" : "7 days"}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-1 border-l-2 border-[var(--signal)] pl-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--signal)]">
              Why it’s on the radar
            </p>
            <ul className="space-y-1 font-sans text-sm text-[var(--ink-muted)]">
              {signals.map((s) => (
                <li key={s.label}>
                  <span className="text-[var(--ink-faint)]">{s.label}: </span>
                  <span
                    className={
                      s.tone === "signal"
                        ? "text-[var(--signal)]"
                        : s.tone === "ink"
                          ? "text-[var(--ink)]"
                          : undefined
                    }
                  >
                    {s.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {repo.categories && repo.categories.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {repo.categories.slice(0, 4).map((c) => (
                <span
                  key={c.slug}
                  className="border border-[var(--rule-strong)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 border-t border-[var(--rule)] pt-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Discovered
            </p>
            <p className="mt-1 font-serif text-xl font-semibold tracking-tight text-[var(--ink)]">
              {formatDate(repo.first_discovered_at).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Signal
            </p>
            <p
              className={
                level === "High"
                  ? "mt-1 font-mono text-sm font-medium uppercase tracking-[0.14em] text-[var(--signal)]"
                  : "mt-1 font-mono text-sm font-medium uppercase tracking-[0.14em] text-[var(--ink)]"
              }
            >
              {level === "High" ? "● " : level === "Rising" ? "◐ " : "○ "}
              {level}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

export function MomentumBars({
  items,
}: {
  items: { name: string; recent: number; delta: number }[];
}) {
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.recent), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="grid grid-cols-[7.5rem_1fr_4rem] items-center gap-3">
          <span className="truncate font-sans text-sm text-[var(--ink)]">{item.name}</span>
          <div className="h-[6px] bg-[var(--rule)]/50">
            <div
              className="h-[6px] bg-[var(--ink)]"
              style={{ width: `${Math.max(4, (item.recent / max) * 100)}%` }}
            />
          </div>
          <span className="text-right font-mono text-[11px] tabular-nums text-[var(--signal)]">
            {item.delta > 0 ? `+${item.delta}` : item.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
