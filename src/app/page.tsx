import Link from "next/link";
import { EmptyState, RepoCard, SectionRule } from "@/components/repo-card";
import { EditorialRadarCard, MomentumBars } from "@/components/radar-editorial";
import {
  formatNumber,
  getAheadOfCurve,
  getCategoryMomentum,
  getHiddenGems,
  getIntelligenceStats,
  getTodaysRadar,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, radar, ahead, gems, momentum] = await Promise.all([
    getIntelligenceStats(),
    getTodaysRadar(8),
    getAheadOfCurve(4),
    getHiddenGems(4),
    getCategoryMomentum(6),
  ]);

  const lead = radar.slice(0, 4);
  const rest = radar.slice(4);

  const kpis = [
    { label: "Repos", value: formatNumber(stats.total_repositories) },
    { label: "Discoveries", value: formatNumber(stats.discoveries_this_month), hint: "30 days" },
    { label: "Fast growers", value: formatNumber(stats.fast_growers) },
    { label: "Hidden gems", value: formatNumber(stats.hidden_gems) },
    {
      label: "Median lead",
      value:
        stats.median_discovery_lead_days != null
          ? `${Math.round(stats.median_discovery_lead_days)}d`
          : "—",
      hint: "creation → discovery",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Compact masthead + KPIs */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1 border-b-2 border-[var(--rule-strong)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              Open-source projects worth watching.
            </h1>
            <p className="mt-1 font-sans text-sm text-[var(--ink-muted)]">
              Discovery timing · growth trajectory · community signal
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
            Intelligence brief
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px border-2 border-[var(--rule-strong)] bg-[var(--rule-strong)] sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="bg-[var(--paper)] px-3 py-4 sm:px-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                {k.label}
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-[var(--ink)] sm:text-3xl">
                {k.value}
              </p>
              {"hint" in k && k.hint ? (
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  {k.hint}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Ahead of curve callout */}
        <Link
          href="/ahead-of-curve"
          className="group flex flex-col gap-1 border-2 border-[var(--rule-strong)] bg-[var(--paper-elevated)] px-4 py-4 transition-colors hover:border-[var(--signal)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--signal)]">
              Ahead of the curve
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-[var(--ink)] sm:text-2xl">
              {formatNumber(stats.ahead_before_1k)} repos discovered before 1K stars
            </p>
            <p className="mt-1 font-sans text-sm text-[var(--ink-muted)]">
              Early channel finds — within 90 days of GitHub creation.
            </p>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink)] group-hover:text-[var(--signal)]">
            View ranking →
          </span>
        </Link>
      </section>

      {/* Today's Radar — editorial */}
      <section>
        <SectionRule title="Today’s Radar" kicker="Latest discoveries" href="/timeline" />
        {lead.length === 0 ? (
          <EmptyState message="No discoveries yet." />
        ) : (
          <div className="border-t-2 border-[var(--rule-strong)]">
            {lead.map((repo, i) => (
              <EditorialRadarCard key={repo.repository_id} repo={repo} index={i + 1} />
            ))}
          </div>
        )}
        {rest.length > 0 ? (
          <div className="mt-2 border-t border-[var(--rule)]">
            {rest.map((repo) => (
              <RepoCard key={repo.repository_id} repo={repo} />
            ))}
          </div>
        ) : null}
      </section>

      {/* What's accelerating */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionRule title="What’s accelerating" kicker="Category momentum · 30d Δ" href="/trends" />
          <div className="border-2 border-[var(--rule-strong)] bg-[var(--paper-elevated)] p-5">
            {momentum.length === 0 ? (
              <p className="font-sans text-sm text-[var(--ink-muted)]">
                Category momentum appears as classifications accumulate.
              </p>
            ) : (
              <>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                  Change vs prior 30 days
                </p>
                <MomentumBars items={momentum} />
              </>
            )}
          </div>
        </div>
        <div>
          <SectionRule title="Pull quote" kicker="Brief" />
          <blockquote className="border-2 border-[var(--rule-strong)] bg-[var(--paper)] px-5 py-6">
            <p className="font-serif text-2xl leading-snug text-[var(--ink)]">
              “The edge isn’t star count. It’s who noticed the project while it
              was still small.”
            </p>
            <footer className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
              — GitHub Radar editorial
            </footer>
          </blockquote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/hidden-gems"
              className="border border-[var(--rule-strong)] px-3 py-3 transition-colors hover:border-[var(--signal)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--signal)]">
                Hidden gems
              </p>
              <p className="mt-1 font-serif text-lg font-semibold">{formatNumber(stats.hidden_gems)}</p>
            </Link>
            <Link
              href="/trending"
              className="border border-[var(--rule-strong)] px-3 py-3 transition-colors hover:border-[var(--signal)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--signal)]">
                Fast growers
              </p>
              <p className="mt-1 font-serif text-lg font-semibold">{formatNumber(stats.fast_growers)}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Secondary modules */}
      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <SectionRule title="Ahead of the Curve" kicker="Early finds" href="/ahead-of-curve" />
          {ahead.length === 0 ? (
            <EmptyState message="Creation dates still enriching." />
          ) : (
            <div className="border-t-2 border-[var(--rule-strong)]">
              {ahead.map((repo) => (
                <RepoCard key={repo.repository_id} repo={repo} emphasis="ahead" />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionRule title="Hidden Gems" kicker="Small · growing" href="/hidden-gems" />
          {gems.length === 0 ? (
            <EmptyState message="Gems unlock after growth signals." />
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
