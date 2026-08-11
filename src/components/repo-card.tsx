import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/queries";
import type { DiscoveryRow } from "@/lib/db";

export function MetricStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <section className="grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[var(--paper)] px-4 py-5 text-center sm:text-left"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {item.label}
          </p>
          <p className="mt-2 font-serif text-2xl text-[var(--ink)] tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

export function SectionRule({
  title,
  kicker,
  href,
}: {
  title: string;
  kicker?: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--rule)] pb-3">
      <div>
        {kicker ? (
          <p className="mb-1 font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--signal)]">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-serif text-2xl text-[var(--ink)] sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 font-sans text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          View all →
        </Link>
      ) : null}
    </div>
  );
}

export function RepoCard({ repo, emphasis }: { repo: DiscoveryRow; emphasis?: "gem" | "ahead" }) {
  const name = repo.full_name || `${repo.owner}/${repo.repo_name}`;
  const href = `/repo/${repo.owner}/${repo.repo_name}`;

  return (
    <article className="group flex flex-col border-b border-[var(--rule)] py-5 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={href} className="font-serif text-xl text-[var(--ink)] group-hover:underline">
          {name}
        </Link>
        <div className="flex items-center gap-3 font-sans text-xs tabular-nums text-[var(--ink-muted)]">
          <span>★ {formatNumber(repo.stars)}</span>
          {repo.forks != null ? <span>⑂ {formatNumber(repo.forks)}</span> : null}
          {repo.language ? <span>{repo.language}</span> : null}
        </div>
      </div>
      {repo.description ? (
        <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
          {repo.description}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
        <span>Discovered {formatDate(repo.first_discovered_at)}</span>
        {repo.mention_count != null ? <span>{repo.mention_count} mentions</span> : null}
        {repo.stars_gained_7d != null && repo.stars_gained_7d !== 0 ? (
          <span className="text-[var(--accent)]">
            {repo.stars_gained_7d > 0 ? "+" : ""}
            {formatNumber(repo.stars_gained_7d)} ★ / 7d
          </span>
        ) : null}
        {repo.discovery_score != null ? (
          <span>Score {repo.discovery_score.toFixed(2)}</span>
        ) : null}
        {emphasis === "ahead" && repo.days_to_discovery != null ? (
          <span className="text-[var(--ink)]">
            +{Math.round(repo.days_to_discovery)}d after creation
          </span>
        ) : null}
        {emphasis === "gem" && repo.gem_score != null ? (
          <span>Gem {repo.gem_score.toFixed(2)}</span>
        ) : null}
      </div>
    </article>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="border border-dashed border-[var(--rule)] px-6 py-16 text-center font-sans text-sm text-[var(--ink-muted)]">
      {message}
    </p>
  );
}
