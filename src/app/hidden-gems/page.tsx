import { EmptyState, RepoCard, SectionRule } from "@/components/repo-card";
import { getHiddenGems } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HiddenGemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const limit = 40;
  const rows = await getHiddenGems(limit, (page - 1) * limit);

  return (
    <div className="space-y-8">
      <SectionRule title="Hidden Gems" kicker="Small today. Growing fast." />
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
        Gems require multiple signals: modest star count, recent growth,
        recent channel discovery, and signs of activity — not simply “low
        stars.”
      </p>
      {rows.length === 0 ? (
        <EmptyState message="Gem rankings unlock after enrichment produces growth snapshots." />
      ) : (
        <div>
          {rows.map((repo) => (
            <RepoCard key={repo.repository_id} repo={repo} emphasis="gem" />
          ))}
        </div>
      )}
      <div className="flex justify-between font-sans text-xs uppercase tracking-[0.12em]">
        {page > 1 ? <Link href={`/hidden-gems?page=${page - 1}`}>← Previous</Link> : <span />}
        {rows.length === limit ? <Link href={`/hidden-gems?page=${page + 1}`}>Next →</Link> : null}
      </div>
    </div>
  );
}
