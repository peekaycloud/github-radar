import Link from "next/link";
import { EmptyState, SectionRule } from "@/components/repo-card";
import {
  CompactRepoRow,
  EditorialRadarCard,
  MomentumBars,
} from "@/components/radar-editorial";
import {
  formatNumber,
  getCategoryMomentum,
  getFastestMoving,
  getHiddenGems,
  getIntelligenceStats,
  getTodaysRadar,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, radar, gems, momentum, fastest] = await Promise.all([
    getIntelligenceStats(),
    getTodaysRadar(4),
    getHiddenGems(5),
    getCategoryMomentum(6),
    getFastestMoving(5),
  ]);

  const kpis: { label: string; value: string; hint?: string }[] = [
    { label: "Repos", value: formatNumber(stats.total_repositories) },
    {
      label: "Discoveries",
      value: formatNumber(stats.discoveries_this_month),
      hint: "30 days",
    },
    { label: "Hidden gems", value: formatNumber(stats.hidden_gems) },
    {
      label: "Median discovery age",
      value:
        stats.median_discovery_age_days != null
          ? `${Math.round(stats.median_discovery_age_days)}d`
          : "—",
      hint: "GitHub creation → discovery",
    },
  ];

  if (stats.fast_growers > 0) {
    kpis.splice(2, 0, {
      label: "Fast growers",
      value: formatNumber(stats.fast_growers),
    });
  }

  const topCategory = momentum[0];
  const storyBits = [
    `This week the channels surfaced ${formatNumber(stats.discoveries_this_week)} new repositories.`,
    topCategory
      ? `${topCategory.name} led category momentum (${topCategory.delta > 0 ? "+" : ""}${topCategory.delta} repos vs prior 30 days).`
      : null,
    stats.crossed_1k_this_week > 0
      ? `${formatNumber(stats.crossed_1k_this_week)} recent finds crossed 1K stars since first snapshot.`
      : null,
    stats.median_discovery_age_days != null
      ? `Median discovery age is ${Math.round(stats.median_discovery_age_days)} days — Ahead of Curve tracks the early exceptions.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      {/* Compact KPI strip */}
      <section>
        <div
          className={`grid gap-px border-2 border-[var(--rule-strong)] bg-[var(--rule-strong)] ${
            kpis.length === 5
              ? "grid-cols-2 sm:grid-cols-5"
              : kpis.length === 4
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {kpis.map((k) => (
            <div key={k.label} className="bg-[var(--paper)] px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                {k.label}
              </p>
              <p className="mt-0.5 font-serif text-xl font-semibold tabular-nums leading-none text-[var(--ink)]">
                {k.value}
              </p>
              {k.hint ? (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  {k.hint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Today's Radar — compact feed */}
      <section>
        <SectionRule title="Today’s Radar" kicker="Latest discoveries" href="/timeline" />
        {radar.length === 0 ? (
          <EmptyState message="No discoveries yet." />
        ) : (
          <div className="border-t-2 border-[var(--rule-strong)]">
            {radar.map((repo, i) => (
              <EditorialRadarCard key={repo.repository_id} repo={repo} index={i + 1} />
            ))}
          </div>
        )}
      </section>

      {/* Trending signals */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionRule
            title="What’s accelerating"
            kicker="Trending signals"
            href="/trends"
          />
          <div className="border border-[var(--rule-strong)] bg-[var(--paper-elevated)] p-4">
            {momentum.length === 0 ? (
              <p className="font-sans text-sm text-[var(--ink-muted)]">
                Category momentum appears as classifications accumulate.
              </p>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                  Additional repos discovered vs prior 30 days
                </p>
                <MomentumBars items={momentum} />
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionRule title="Fastest moving" kicker="Observed growth" href="/trending" />
            <div className="border border-[var(--rule-strong)] px-3">
              {fastest.length === 0 ? (
                <p className="py-3 font-sans text-sm text-[var(--ink-muted)]">
                  Growth rankings unlock as daily snapshots accumulate.
                </p>
              ) : (
                fastest.map((repo) => (
                  <CompactRepoRow
                    key={repo.repository_id}
                    repo={repo}
                    metric={`+${repo.pct_growth_observed.toFixed(0)}%`}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <SectionRule title="Hidden gems" kicker="Small · selective" href="/hidden-gems" />
            <div className="border border-[var(--rule-strong)] px-3">
              {gems.length === 0 ? (
                <p className="py-3 font-sans text-sm text-[var(--ink-muted)]">
                  Selective gems need modest stars plus a growth or freshness signal.
                </p>
              ) : (
                gems.map((repo) => {
                  const pct =
                    repo.stars_pct_growth_7d ?? repo.stars_pct_growth_observed ?? null;
                  return (
                    <CompactRepoRow
                      key={repo.repository_id}
                      repo={repo}
                      metric={
                        pct != null && pct > 0
                          ? `+${Number(pct).toFixed(0)}%`
                          : `★ ${formatNumber(repo.stars)}`
                      }
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Discovery story */}
      <section>
        <SectionRule title="Discovery story" kicker="This week" />
        <div className="border-2 border-[var(--rule-strong)] border-l-[3px] border-l-[var(--signal)] bg-[var(--paper-elevated)] px-4 py-4">
          <p className="font-serif text-lg leading-snug text-[var(--ink)] sm:text-xl">
            {storyBits.join(" ")}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            <Link href="/ahead-of-curve" className="text-[var(--signal)] hover:underline">
              Ahead of Curve →
            </Link>
            <span className="mx-2 text-[var(--rule)]">·</span>
            Early discovery & star trajectory live on a dedicated page
          </p>
        </div>
      </section>
    </div>
  );
}
