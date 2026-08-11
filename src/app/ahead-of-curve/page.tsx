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
        How early did the community discover a project relative to its GitHub
        creation — and how much did it grow afterward? Star counts at discovery
        improve as enrichment snapshots accumulate.
      </p>
      {rows.length === 0 ? (
        <EmptyState message="Needs repository creation dates from enrichment." />
      ) : (
        <div className="space-y-0 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {rows.map((repo, idx) => {
            const href = `/repo/${repo.owner}/${repo.repo_name}`;
            const thenStars = repo.stars_at_discovery;
            const nowStars = repo.current_stars ?? repo.stars;
            return (
              <article key={repo.repository_id} className="grid gap-4 py-6 lg:grid-cols-[3rem_1fr_auto]">
                <p className="font-mono text-sm text-[var(--ink-faint)]">
                  {String((page - 1) * limit + idx + 1).padStart(2, "0")}
                </p>
                <div>
                  <Link href={href} className="font-serif text-xl hover:underline">
                    {repo.full_name}
                  </Link>
                  {repo.description ? (
                    <p className="mt-2 line-clamp-2 font-sans text-sm text-[var(--ink-muted)]">
                      {repo.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                    <span>Created {formatDate(repo.created_at_github)}</span>
                    <span>Discovered {formatDate(repo.first_discovered_at)}</span>
                    {repo.days_to_discovery != null ? (
                      <span className="text-[var(--signal)]">
                        Discovered {Math.round(repo.days_to_discovery)} days after creation
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-[10rem] font-sans text-sm tabular-nums text-[var(--ink)]">
                  <p>
                    Stars then → now:{" "}
                    <strong>
                      {formatNumber(thenStars)} → {formatNumber(nowStars)}
                    </strong>
                  </p>
                  {repo.growth_multiple != null ? (
                    <p className="mt-1 text-[var(--signal)]">
                      {repo.growth_multiple.toFixed(1)}× growth since discovery
                    </p>
                  ) : (
                    <p className="mt-1 text-[var(--ink-faint)]">Growth pending snapshots</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="flex justify-between font-sans text-xs uppercase tracking-[0.12em]">
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
