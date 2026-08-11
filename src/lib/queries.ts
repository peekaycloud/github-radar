import { sql, type DiscoveryRow } from "./db";

export type CommunityStats = {
  total_repositories: number;
  total_telegram_posts: number;
  total_mentions: number;
  total_categories: number;
  avg_stars: number;
  new_discoveries_this_week: number;
  repositories_enriched: number;
};

export async function getCommunityStats(): Promise<CommunityStats> {
  const rows = await sql<CommunityStats[]>`
    SELECT
      total_repositories::int,
      total_telegram_posts::int,
      total_mentions::int,
      total_categories::int,
      avg_stars::float,
      new_discoveries_this_week::int,
      repositories_enriched::int
    FROM v_community_stats
  `;
  return (
    rows[0] ?? {
      total_repositories: 0,
      total_telegram_posts: 0,
      total_mentions: 0,
      total_categories: 0,
      avg_stars: 0,
      new_discoveries_this_week: 0,
      repositories_enriched: 0,
    }
  );
}

export async function getTodaysRadar(limit = 12): Promise<DiscoveryRow[]> {
  const rows = await sql<DiscoveryRow[]>`
    SELECT
      d.*,
      ds.discovery_score,
      g.stars_gained_7d,
      g.stars_gained_30d,
      g.stars_pct_growth_7d,
      CASE
        WHEN snap30.stars IS NOT NULL AND snap30.stars > 0
        THEN ((COALESCE(d.stars, 0) - snap30.stars)::float / snap30.stars::float) * 100.0
        ELSE NULL
      END AS stars_pct_growth_30d,
      sad.stars_at_discovery
    FROM v_repository_discovery d
    LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
    LEFT JOIN v_repository_growth g ON g.repository_id = d.repository_id
    LEFT JOIN v_stars_at_discovery sad ON sad.repository_id = d.repository_id
    LEFT JOIN LATERAL (
      SELECT s.stars
      FROM github_repo_snapshots s
      WHERE s.repository_id = d.repository_id
        AND s.captured_at <= NOW() - INTERVAL '30 days'
      ORDER BY s.captured_at DESC
      LIMIT 1
    ) snap30 ON TRUE
    WHERE d.first_discovered_at IS NOT NULL
    ORDER BY d.first_discovered_at DESC NULLS LAST
    LIMIT ${limit}
  `;

  const withCats = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      categories: await getRepoCategories(row.repository_id),
    }))
  );
  return withCats;
}

export type IntelligenceStats = {
  total_repositories: number;
  discoveries_this_month: number;
  discoveries_this_week: number;
  fast_growers: number;
  hidden_gems: number;
  median_discovery_age_days: number | null;
  crossed_1k_this_week: number;
};

export async function getIntelligenceStats(): Promise<IntelligenceStats> {
  const rows = await sql<IntelligenceStats[]>`
    SELECT
      (SELECT COUNT(*)::int FROM repositories) AS total_repositories,
      (
        SELECT COUNT(*)::int
        FROM v_repository_discovery
        WHERE first_discovered_at >= NOW() - INTERVAL '30 days'
      ) AS discoveries_this_month,
      (
        SELECT COUNT(*)::int
        FROM v_repository_discovery
        WHERE first_discovered_at >= NOW() - INTERVAL '7 days'
      ) AS discoveries_this_week,
      (
        SELECT COUNT(*)::int FROM (
          SELECT g.repository_id
          FROM v_repository_growth g
          WHERE COALESCE(g.stars_gained_7d, 0) >= 50
             OR COALESCE(g.stars_pct_growth_7d, 0) >= 15
             OR COALESCE(g.stars_gained_30d, 0) >= 100
          UNION
          SELECT s.repository_id
          FROM github_repo_snapshots s
          GROUP BY s.repository_id
          HAVING MAX(s.stars) - MIN(s.stars) >= 20
        ) growers
      ) AS fast_growers,
      (SELECT COUNT(*)::int FROM v_hidden_gems) AS hidden_gems,
      (
        SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_discovery)
        FROM v_repository_discovery
        WHERE days_to_discovery IS NOT NULL AND days_to_discovery >= 0
      )::float AS median_discovery_age_days,
      (
        -- Repos whose earliest known stars were <1K and current stars >=1K,
        -- with a recent discovery or recent snapshot activity.
        SELECT COUNT(*)::int
        FROM v_stars_at_discovery sad
        JOIN v_repository_discovery d ON d.repository_id = sad.repository_id
        WHERE sad.stars_at_discovery < 1000
          AND COALESCE(d.stars, 0) >= 1000
          AND d.first_discovered_at >= NOW() - INTERVAL '30 days'
      ) AS crossed_1k_this_week
  `;
  return (
    rows[0] ?? {
      total_repositories: 0,
      discoveries_this_month: 0,
      discoveries_this_week: 0,
      fast_growers: 0,
      hidden_gems: 0,
      median_discovery_age_days: null,
      crossed_1k_this_week: 0,
    }
  );
}

export type FastMover = DiscoveryRow & {
  pct_growth_observed: number;
};

export async function getFastestMoving(limit = 5): Promise<FastMover[]> {
  return sql<FastMover[]>`
    WITH snap AS (
      SELECT
        repository_id,
        MIN(stars) AS min_stars,
        MAX(stars) AS max_stars,
        CASE
          WHEN MIN(stars) > 0
          THEN ((MAX(stars) - MIN(stars))::float / MIN(stars)::float) * 100.0
          ELSE 0::float
        END AS pct
      FROM github_repo_snapshots
      GROUP BY repository_id
      HAVING COUNT(*) >= 2 AND MAX(stars) > MIN(stars)
    )
    SELECT
      d.*,
      COALESCE(g.stars_pct_growth_7d, s.pct) AS pct_growth_observed,
      g.stars_gained_7d,
      g.stars_pct_growth_7d
    FROM snap s
    JOIN v_repository_discovery d ON d.repository_id = s.repository_id
    LEFT JOIN v_repository_growth g ON g.repository_id = d.repository_id
    ORDER BY COALESCE(g.stars_pct_growth_7d, s.pct) DESC NULLS LAST
    LIMIT ${limit}
  `;
}

export type CategoryMomentum = {
  name: string;
  slug: string;
  recent: number;
  previous: number;
  delta: number;
};

export async function getCategoryMomentum(limit = 6): Promise<CategoryMomentum[]> {
  return sql<CategoryMomentum[]>`
    WITH recent AS (
      SELECT c.slug, c.name, COUNT(DISTINCT m.repository_id)::int AS n
      FROM repository_categories rc
      JOIN categories c ON c.id = rc.category_id
      JOIN telegram_repo_mentions m ON m.repository_id = rc.repository_id
      JOIN telegram_posts p ON p.id = m.telegram_post_id
      WHERE COALESCE(m.discovered_at, p.posted_at) >= NOW() - INTERVAL '30 days'
        AND c.slug NOT IN ('other', 'open-source')
      GROUP BY c.slug, c.name
    ),
    previous AS (
      SELECT c.slug, COUNT(DISTINCT m.repository_id)::int AS n
      FROM repository_categories rc
      JOIN categories c ON c.id = rc.category_id
      JOIN telegram_repo_mentions m ON m.repository_id = rc.repository_id
      JOIN telegram_posts p ON p.id = m.telegram_post_id
      WHERE COALESCE(m.discovered_at, p.posted_at) >= NOW() - INTERVAL '60 days'
        AND COALESCE(m.discovered_at, p.posted_at) < NOW() - INTERVAL '30 days'
        AND c.slug NOT IN ('other', 'open-source')
      GROUP BY c.slug
    )
    SELECT
      r.name,
      r.slug,
      r.n AS recent,
      COALESCE(p.n, 0) AS previous,
      (r.n - COALESCE(p.n, 0)) AS delta
    FROM recent r
    LEFT JOIN previous p ON p.slug = r.slug
    ORDER BY delta DESC, r.n DESC
    LIMIT ${limit}
  `;
}

export async function getTrending(
  window: "1d" | "7d" | "30d" | "all" = "7d",
  limit = 50,
  offset = 0
): Promise<DiscoveryRow[]> {
  if (window === "all") {
    return sql<DiscoveryRow[]>`
      SELECT d.*, ds.discovery_score, g.stars_gained_7d, g.stars_gained_30d
      FROM v_repository_discovery d
      LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
      LEFT JOIN v_repository_growth g ON g.repository_id = d.repository_id
      ORDER BY COALESCE(d.stars, 0) DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const gainCol =
    window === "1d"
      ? sql`g.stars_gained_1d`
      : window === "30d"
        ? sql`g.stars_gained_30d`
        : sql`g.stars_gained_7d`;

  return sql<DiscoveryRow[]>`
    SELECT d.*, ds.discovery_score,
      g.stars_gained_1d, g.stars_gained_7d, g.stars_gained_30d
    FROM v_repository_discovery d
    LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
    LEFT JOIN v_repository_growth g ON g.repository_id = d.repository_id
    ORDER BY COALESCE(${gainCol}, 0) DESC, ds.discovery_score DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getHiddenGems(limit = 50, offset = 0): Promise<DiscoveryRow[]> {
  return sql<DiscoveryRow[]>`
    SELECT *
    FROM v_hidden_gems
    ORDER BY gem_score DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getAheadOfCurve(limit = 50, offset = 0): Promise<DiscoveryRow[]> {
  return sql<DiscoveryRow[]>`
    SELECT *
    FROM v_ahead_of_curve
    WHERE days_to_discovery IS NOT NULL
    ORDER BY ahead_score DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getTimeline(limit = 60) {
  return sql<
    { discovery_date: string; repositories_discovered: number; posts_count: number }[]
  >`
    SELECT
      discovery_date::text,
      repositories_discovered::int,
      posts_count::int
    FROM v_discovery_timeline
    ORDER BY discovery_date DESC
    LIMIT ${limit}
  `;
}

export async function getReposForDate(date: string) {
  return sql<DiscoveryRow[]>`
    SELECT d.*, ds.discovery_score
    FROM v_repository_discovery d
    LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
    WHERE DATE(d.first_discovered_at) = ${date}::date
    ORDER BY COALESCE(d.stars, 0) DESC
  `;
}

export async function getRepository(owner: string, repo: string) {
  const rows = await sql<DiscoveryRow[]>`
    SELECT
      d.*,
      ds.discovery_score,
      g.stars_gained_1d,
      g.stars_gained_7d,
      g.stars_gained_30d,
      sad.stars_at_discovery
    FROM v_repository_discovery d
    LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
    LEFT JOIN v_repository_growth g ON g.repository_id = d.repository_id
    LEFT JOIN v_stars_at_discovery sad ON sad.repository_id = d.repository_id
    WHERE lower(d.owner) = lower(${owner})
      AND lower(d.repo_name) = lower(${repo})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getRepoMentions(repositoryId: string) {
  return sql<
    {
      telegram_message_id: number;
      posted_at: string;
      text: string | null;
      source_channel: string | null;
    }[]
  >`
    SELECT
      p.telegram_message_id,
      p.posted_at,
      p.text,
      p.source_channel
    FROM telegram_repo_mentions m
    JOIN telegram_posts p ON p.id = m.telegram_post_id
    WHERE m.repository_id = ${repositoryId}::uuid
    ORDER BY p.posted_at ASC
  `;
}

export async function getRepoSnapshots(repositoryId: string) {
  return sql<
    {
      captured_at: string;
      stars: number | null;
      forks: number | null;
      watchers: number | null;
      open_issues: number | null;
    }[]
  >`
    SELECT captured_at, stars, forks, watchers, open_issues
    FROM github_repo_snapshots
    WHERE repository_id = ${repositoryId}::uuid
    ORDER BY captured_at ASC
  `;
}

export async function getRepoCategories(repositoryId: string) {
  return sql<{ slug: string; name: string }[]>`
    SELECT c.slug, c.name
    FROM repository_categories rc
    JOIN categories c ON c.id = rc.category_id
    WHERE rc.repository_id = ${repositoryId}::uuid
    ORDER BY c.name
  `;
}

export async function searchRepositories(opts: {
  q?: string;
  language?: string;
  category?: string;
  minStars?: number;
  archived?: boolean;
  fork?: boolean;
  limit?: number;
  offset?: number;
}) {
  const limit = opts.limit ?? 40;
  const offset = opts.offset ?? 0;
  const q = opts.q?.trim();

  return sql<DiscoveryRow[]>`
    SELECT
      d.*,
      ds.discovery_score
    FROM v_repository_discovery d
    LEFT JOIN v_discovery_score ds ON ds.repository_id = d.repository_id
    WHERE 1=1
      ${q ? sql`AND (
        d.full_name ILIKE ${"%" + q + "%"}
        OR d.description ILIKE ${"%" + q + "%"}
        OR d.owner ILIKE ${"%" + q + "%"}
        OR d.language ILIKE ${"%" + q + "%"}
        OR EXISTS (
          SELECT 1 FROM repository_categories rc
          JOIN categories c ON c.id = rc.category_id
          WHERE rc.repository_id = d.repository_id
            AND c.name ILIKE ${"%" + q + "%"}
        )
        OR EXISTS (
          SELECT 1 FROM telegram_repo_mentions m
          JOIN telegram_posts p ON p.id = m.telegram_post_id
          WHERE m.repository_id = d.repository_id
            AND p.text ILIKE ${"%" + q + "%"}
        )
      )` : sql``}
      ${opts.language ? sql`AND lower(d.language) = lower(${opts.language})` : sql``}
      ${opts.category ? sql`AND EXISTS (
        SELECT 1 FROM repository_categories rc
        JOIN categories c ON c.id = rc.category_id
        WHERE rc.repository_id = d.repository_id AND c.slug = ${opts.category}
      )` : sql``}
      ${opts.minStars != null ? sql`AND COALESCE(d.stars, 0) >= ${opts.minStars}` : sql``}
      ${opts.archived === true ? sql`AND d.is_archived IS TRUE` : sql``}
      ${opts.archived === false ? sql`AND (d.is_archived IS FALSE OR d.is_archived IS NULL)` : sql``}
      ${opts.fork === true ? sql`AND d.is_fork IS TRUE` : sql``}
      ${opts.fork === false ? sql`AND (d.is_fork IS FALSE OR d.is_fork IS NULL)` : sql``}
    ORDER BY COALESCE(ds.discovery_score, 0) DESC, COALESCE(d.stars, 0) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getLanguages() {
  return sql<{ language: string; count: number }[]>`
    SELECT language, COUNT(*)::int AS count
    FROM repositories
    WHERE language IS NOT NULL AND language <> ''
    GROUP BY language
    ORDER BY count DESC
    LIMIT 40
  `;
}

export async function getCategories() {
  return sql<{ slug: string; name: string; count: number }[]>`
    SELECT c.slug, c.name, COUNT(rc.repository_id)::int AS count
    FROM categories c
    LEFT JOIN repository_categories rc ON rc.category_id = c.id
    GROUP BY c.slug, c.name
    ORDER BY count DESC, c.name
  `;
}

export async function getTopOwners(limit = 20) {
  return sql<{ owner: string; repo_count: number; total_stars: number }[]>`
    SELECT owner, repo_count::int, total_stars::bigint AS total_stars
    FROM v_top_owners
    ORDER BY repo_count DESC
    LIMIT ${limit}
  `;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
