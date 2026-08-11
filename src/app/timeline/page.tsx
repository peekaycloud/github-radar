import { EmptyState, RepoCard, SectionRule } from "@/components/repo-card";
import { TimelineBars } from "@/components/charts";
import { formatDate, getReposForDate, getTimeline } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const timeline = await getTimeline(45);
  const selected = params.date || timeline[0]?.discovery_date;
  const dayRepos = selected ? await getReposForDate(selected) : [];

  return (
    <div className="space-y-10">
      <SectionRule title="Timeline" kicker="Discovery calendar" />
      <p className="max-w-2xl font-sans text-sm text-[var(--ink-muted)]">
        Each day is a dispatch from the channel — repositories first seen on
        that date.
      </p>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="border border-[var(--rule)] bg-[var(--paper-elevated)] p-4">
          <TimelineBars data={timeline.slice(0, 30)} />
          <ul className="mt-6 max-h-[28rem] space-y-2 overflow-y-auto border-t border-[var(--rule)] pt-4">
            {timeline.map((d) => (
              <li key={d.discovery_date}>
                <Link
                  href={`/timeline?date=${d.discovery_date}`}
                  className={
                    selected === d.discovery_date
                      ? "flex justify-between font-sans text-sm text-[var(--signal)]"
                      : "flex justify-between font-sans text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }
                >
                  <span className="uppercase tracking-[0.08em]">
                    {formatDate(d.discovery_date)}
                  </span>
                  <span className="tabular-nums">
                    {d.repositories_discovered} repositories
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-serif text-2xl">
            {selected ? formatDate(selected) : "Select a date"}
          </h3>
          {dayRepos.length === 0 ? (
            <EmptyState message="No repositories for this date." />
          ) : (
            <div>
              {dayRepos.map((repo) => (
                <RepoCard key={repo.repository_id} repo={repo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
