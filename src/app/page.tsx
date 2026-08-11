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
    <div className="space-y-16">
      <section className="animate-masthead max-w-3xl border-b-2 border-[var(--rule-strong)] pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--signal)]">
          Daily dispatch
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--ink)] sm:text-6xl">
          What is emerging —
          <br />
          <span className="text-[var(--signal)]">and who saw it first?</span>
        </h1>
        <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-[var(--ink-muted)]">
          Timing over hype. Channel discoveries, public GitHub signals, and
          growth trajectory in one editorial brief.
        </p>
      </section>

      <MetricStrip items={metrics} />

      <section>
        <SectionRule title="Today’s Radar" kicker="Latest discoveries" href="/timeline" />
        {radar.length === 0 ? (
          <EmptyState message="No discoveries yet. Run the historical import to populate the radar." />
        ) : (
          <div className="border-t-2 border-[var(--rule-strong)]">
            {radar.map((repo) => (
              <RepoCard key={repo.repository_id} repo={repo} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
        <section>
          <SectionRule
            title="Ahead of the Curve"
            kicker="Early discovery"
            href="/ahead-of-curve"
          />
          {ahead.length === 0 ? (
            <EmptyState message="Waiting on repository creation dates from enrichment — re-run the enricher." />
          ) : (
            <div className="border-t-2 border-[var(--rule-strong)]">
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
            <div className="border-t-2 border-[var(--rule-strong)]">
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
