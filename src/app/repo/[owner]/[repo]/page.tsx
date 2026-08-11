import { notFound } from "next/navigation";
import Link from "next/link";
import { GrowthChart } from "@/components/charts";
import {
  formatDate,
  formatNumber,
  getRepoCategories,
  getRepoMentions,
  getRepoSnapshots,
  getRepository,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const repository = await getRepository(owner, repo);
  if (!repository) notFound();

  const [mentions, snapshots, categories] = await Promise.all([
    getRepoMentions(repository.repository_id),
    getRepoSnapshots(repository.repository_id),
    getRepoCategories(repository.repository_id),
  ]);

  const chartData = snapshots.map((s) => ({
    date: new Date(s.captured_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    stars: s.stars,
    forks: s.forks,
  }));

  const first = mentions[0];
  const last = mentions[mentions.length - 1];
  const channel = first?.source_channel || "githubtrending";

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--rule)] pb-8">
        <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          Repository
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--ink)] sm:text-5xl">
          {repository.full_name}
        </h1>
        {repository.description ? (
          <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-[var(--ink-muted)]">
            {repository.description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-4 font-sans text-sm text-[var(--ink-muted)]">
          <a
            href={repository.github_url || `https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
          >
            View on GitHub
          </a>
          <span>★ {formatNumber(repository.stars)}</span>
          <span>⑂ {formatNumber(repository.forks)}</span>
          {repository.language ? <span>{repository.language}</span> : null}
          {repository.license ? <span>{repository.license}</span> : null}
        </div>
        {categories.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.slug}
                className="border border-[var(--rule)] px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section className="grid gap-8 lg:grid-cols-3">
        <Meta
          label="Repository age"
          value={
            repository.created_at_github
              ? `Since ${formatDate(repository.created_at_github)}`
              : "Unknown"
          }
        />
        <Meta
          label="Last activity"
          value={formatDate(repository.pushed_at_github)}
        />
        <Meta
          label="Enrichment"
          value={repository.enrichment_status || "pending"}
        />
      </section>

      <section>
        <h2 className="mb-4 border-b border-[var(--rule)] pb-2 font-serif text-2xl">
          Telegram Discovery
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta label="First discovered" value={formatDate(repository.first_discovered_at)} />
          <Meta label="Last seen on channel" value={formatDate(repository.last_mentioned_at)} />
          <Meta
            label="Days to discovery"
            value={
              repository.days_to_discovery != null
                ? `${Math.round(repository.days_to_discovery)} days`
                : "—"
            }
          />
        </div>
        <ul className="mt-6 space-y-4">
          {mentions.map((m) => (
            <li key={m.telegram_message_id} className="border-l-2 border-[var(--rule)] pl-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--ink-faint)]">
                  {formatDate(m.posted_at)}
                </span>
                <a
                  href={`https://t.me/${channel}/${m.telegram_message_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-xs uppercase tracking-[0.1em] text-[var(--signal)] hover:underline"
                >
                  Telegram #{m.telegram_message_id}
                </a>
              </div>
              {m.text ? (
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap font-sans text-sm text-[var(--ink-muted)]">
                  {m.text}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {first && last && first.telegram_message_id !== last.telegram_message_id ? (
          <p className="mt-4 font-sans text-xs text-[var(--ink-faint)]">
            First post #{first.telegram_message_id} · Last post #{last.telegram_message_id}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 border-b border-[var(--rule)] pb-2 font-serif text-2xl">
          Growth
        </h2>
        <GrowthChart data={chartData} metric="stars" />
      </section>

      <section>
        <h2 className="mb-4 border-b border-[var(--rule)] pb-2 font-serif text-2xl">
          Discovery
        </h2>
        <div className="space-y-2 font-sans text-sm leading-relaxed text-[var(--ink-muted)]">
          {repository.days_to_discovery != null ? (
            <p>
              Discovered{" "}
              <strong className="text-[var(--ink)]">
                {Math.round(repository.days_to_discovery)} days
              </strong>{" "}
              after repository creation.
            </p>
          ) : (
            <p>Creation date not yet enriched — discovery lag unavailable.</p>
          )}
          <p>
            Stars at discovery:{" "}
            <strong className="text-[var(--ink)]">
              {formatNumber(repository.stars_at_discovery)}
            </strong>
          </p>
          <p>
            Current stars:{" "}
            <strong className="text-[var(--ink)]">{formatNumber(repository.stars)}</strong>
          </p>
          {repository.discovery_score != null ? (
            <p>
              Discovery score:{" "}
              <strong className="text-[var(--ink)]">
                {repository.discovery_score.toFixed(3)}
              </strong>
            </p>
          ) : null}
        </div>
      </section>

      <p>
        <Link
          href="/repositories"
          className="font-sans text-xs uppercase tracking-[0.14em] text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          ← Back to repositories
        </Link>
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--rule)] bg-[var(--paper-elevated)] px-4 py-4">
      <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
        {label}
      </p>
      <p className="mt-2 font-serif text-lg text-[var(--ink)]">{value}</p>
    </div>
  );
}
