import { MetricStrip, RepoCard, SectionRule, EmptyState } from "@/components/repo-card";
import {
  formatNumber,
  getCommunityStats,
  getTodaysRadar,
  getAheadOfCurve,
  getHiddenGems,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, radar, ahead, gems] = await Promise.all([
    getCommunityStats(),
    getTodaysRadar(10),
    getAheadOfCurve(5),
    getHiddenGems(5),
  ]);

  const metrics = [
    { label: "Repositories", value: formatNumber(stats.total_repositories) },
    {
      label: "New this week",
      value: formatNumber(stats.new_discoveries_this_week),
    },
    {
      label: "Tracked / enriched",
      value: formatNumber(stats.repositories_enriched),
    },
    { label: "Telegram posts", value: formatNumber(stats.total_telegram_posts) },
    { label: "Categories", value: formatNumber(stats.total_categories) },
    { label: "Average stars", value: formatNumber(Math.round(stats.avg_stars)) },
  ];

  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--signal)]">
          Daily intelligence
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          What interesting open-source is emerging — and who saw it first?
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-[var(--ink-muted)]">
          GitHub Radar combines a public Telegram discovery channel with
          historical repository growth. The signal is not star count alone — it
          is timing, repetition, and trajectory.
        </p>
      </section>

      <MetricStrip items={metrics} />

      <section>
        <SectionRule title="Today’s Radar" kicker="Latest discoveries" href="/timeline" />
        {radar.length === 0 ? (
          <EmptyState message="No discoveries yet. Run the historical import to populate the radar." />
        ) : (
          <div className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            {radar.map((repo) => (
              <RepoCard key={repo.repository_id} repo={repo} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <SectionRule
            title="Ahead of the Curve"
            kicker="Early discovery"
            href="/ahead-of-curve"
          />
          {ahead.length === 0 ? (
            <EmptyState message="Enrichment snapshots needed for growth-since-discovery rankings." />
          ) : (
            <div>
              {ahead.map((repo) => (
                <RepoCard key={repo.repository_id} repo={repo} emphasis="ahead" />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionRule
            title="Hidden Gems"
            kicker="Small today. Growing fast."
            href="/hidden-gems"
          />
          {gems.length === 0 ? (
            <EmptyState message="Gems appear after enrichment provides growth signals." />
          ) : (
            <div>
              {gems.map((repo) => (
                <RepoCard key={repo.repository_id} repo={repo} emphasis="gem" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
