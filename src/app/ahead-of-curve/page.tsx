import { EmptyState, SectionRule } from "@/components/repo-card";
import { formatDate, formatNumber, getAheadOfCurve } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AheadPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const limit = 40;
  const rows = await getAheadOfCurve(limit, (page - 1) * limit);

  return (
    <div className="space-y-8">
      <SectionRule title="Ahead of the Curve" kicker="Signature ranking" />
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
        Two signals, one ranking.{" "}
        <span className="text-[var(--ink)]">Early discovery</span> is days from
        GitHub creation to first Telegram mention.{" "}
        <span className="text-[var(--ink)]">Ahead of curve</span> is the star
        trajectory from discovery to now (e.g. 183 → 12.4K). Creation dates come
        from public repository pages.
      </p>
      {rows.length === 0 ? (
        <EmptyState message="No creation dates yet. Enrichment is catching up — check back after the next enrich run." />
      ) : (
        <div className="space-y-0 divide-y divide-[var(--rule)] border-y-2 border-[var(--rule-strong)]">
          {rows.map((repo, idx) => {
            const href = `/repo/${repo.owner}/${repo.repo_name}`;
            const thenStars = repo.stars_at_discovery;
            const nowStars = repo.current_stars ?? repo.stars;
            return (
              <article
                key={repo.repository_id}
                className="grid gap-4 py-7 lg:grid-cols-[3.5rem_1fr_auto]"
              >
                <p className="font-mono text-sm font-medium text-[var(--signal)]">
                  {String((page - 1) * limit + idx + 1).padStart(2, "0")}
                </p>
                <div>
                  <Link
                    href={href}
                    className="font-serif text-2xl font-semibold tracking-tight hover:underline decoration-[var(--signal)] underline-offset-4"
                  >
                    {repo.full_name}
                  </Link>
                  {repo.description ? (
                    <p className="mt-2 line-clamp-2 font-sans text-sm text-[var(--ink-muted)]">
                      {repo.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    <span>Created {formatDate(repo.created_at_github)}</span>
                    <span>Discovered {formatDate(repo.first_discovered_at)}</span>
                    {repo.days_to_discovery != null ? (
                      <span className="font-medium text-[var(--signal)]">
                        {Math.round(repo.days_to_discovery)} days after creation
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-[11rem] font-mono text-sm tabular-nums text-[var(--ink)]">
                  <p>
                    <span className="text-[var(--ink-faint)]">Then → now</span>
                    <br />
                    <strong className="text-base">
                      {formatNumber(thenStars)} → {formatNumber(nowStars)}
                    </strong>
                  </p>
                  {repo.growth_multiple != null ? (
                    <p className="mt-2 font-medium text-[var(--signal)]">
                      {repo.growth_multiple.toFixed(1)}× since discovery
                    </p>
                  ) : (
                    <p className="mt-2 text-[var(--ink-faint)]">Growth pending</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="flex justify-between font-mono text-xs uppercase tracking-[0.12em]">
        {page > 1 ? (
          <Link href={`/ahead-of-curve?page=${page - 1}`}>← Previous</Link>
        ) : (
          <span />
        )}
        {rows.length === limit ? (
          <Link href={`/ahead-of-curve?page=${page + 1}`}>Next →</Link>
        ) : null}
      </div>
    </div>
  );
}
