import Link from "next/link";
import type { DiscoveryRow } from "@/lib/db";
import { formatDateShort, formatNumber } from "@/lib/queries";

function growthPct(repo: DiscoveryRow): number | null {
  const g = repo.stars_pct_growth_30d ?? repo.stars_pct_growth_7d ?? null;
  if (g == null || !Number.isFinite(g) || g === 0) return null;
  return g;
}

export function EditorialRadarCard({
  repo,
  index,
}: {
  repo: DiscoveryRow;
  index: number;
}) {
  const name = repo.full_name || `${repo.owner}/${repo.repo_name}`;
  const href = `/repo/${repo.owner}/${repo.repo_name}`;
  const growth = growthPct(repo);
  const cats = (repo.categories ?? []).slice(0, 3);
  const days =
    repo.days_to_discovery != null && repo.days_to_discovery >= 0
      ? Math.round(repo.days_to_discovery)
      : null;

  return (
    <article className="border-b border-[var(--rule)] py-3.5 first:pt-1 last:border-b-0">
      <div className="grid gap-2 sm:grid-cols-[2rem_1fr_auto] sm:items-start sm:gap-4">
        <p className="font-mono text-xs font-medium tabular-nums text-[var(--signal)]">
          {String(index).padStart(2, "0")}
        </p>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Link
              href={href}
              className="font-serif text-base font-semibold tracking-tight text-[var(--ink)] hover:underline decoration-[var(--signal)] underline-offset-2 sm:text-lg"
            >
              {name}
            </Link>
            <span className="font-mono text-sm tabular-nums text-[var(--ink)]">
              ★ {formatNumber(repo.stars)}
            </span>
          </div>

          {repo.description ? (
            <p className="mt-1 line-clamp-1 font-sans text-sm text-[var(--ink-muted)]">
              {repo.description}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
            {cats.length > 0 ? (
              <span className="text-[var(--ink-muted)]">
                {cats.map((c) => c.name).join(" · ")}
              </span>
            ) : repo.language ? (
              <span className="text-[var(--ink-muted)]">{repo.language}</span>
            ) : null}
            <span>
              Discovered {formatDateShort(repo.first_discovered_at)}
            </span>
            {growth != null ? (
              <span className="text-[var(--signal)]">
                {growth > 0 ? "+" : ""}
                {growth.toFixed(0)}% / {repo.stars_pct_growth_30d != null ? "30d" : "7d"}
              </span>
            ) : null}
          </div>
        </div>

        <aside className="hidden w-[6.5rem] shrink-0 text-right sm:block">
          {growth != null ? (
            <>
              <p className="font-serif text-lg font-semibold tabular-nums leading-none text-[var(--signal)]">
                {growth > 0 ? "+" : ""}
                {growth.toFixed(0)}%
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                {repo.stars_pct_growth_30d != null ? "30d growth" : "7d growth"}
              </p>
            </>
          ) : days != null ? (
            <>
              <p className="font-serif text-lg font-semibold tabular-nums leading-none text-[var(--ink)]">
                {days}d
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                creation → discovery
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-base font-semibold leading-none text-[var(--ink)]">
                {formatDateShort(repo.first_discovered_at)}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                Discovered
              </p>
            </>
          )}
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
  const max = Math.max(...items.map((i) => Math.abs(i.delta) || i.recent), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.name} className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2">
          <span className="truncate font-sans text-sm text-[var(--ink)]">{item.name}</span>
          <div className="h-[5px] bg-[var(--rule)]/40">
            <div
              className="h-[5px] bg-[var(--ink)]"
              style={{
                width: `${Math.max(4, (Math.max(item.delta, 0) / max) * 100)}%`,
              }}
            />
          </div>
          <span className="text-right font-mono text-[11px] tabular-nums text-[var(--signal)]">
            {item.delta > 0 ? `+${item.delta}` : item.delta} repos
          </span>
        </div>
      ))}
    </div>
  );
}

export function CompactRepoRow({
  repo,
  metric,
  metricLabel,
}: {
  repo: DiscoveryRow;
  metric: string;
  metricLabel?: string;
}) {
  const name = repo.full_name || `${repo.owner}/${repo.repo_name}`;
  const href = `/repo/${repo.owner}/${repo.repo_name}`;
  return (
    <Link
      href={href}
      className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] py-2 last:border-b-0 hover:bg-[var(--paper-elevated)]"
    >
      <span className="min-w-0 truncate font-sans text-sm text-[var(--ink)]">{name}</span>
      <span className="shrink-0 text-right">
        <span className="font-mono text-sm tabular-nums text-[var(--signal)]">{metric}</span>
        {metricLabel ? (
          <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
            {metricLabel}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
