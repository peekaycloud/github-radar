import { EmptyState, RepoCard, SectionRule } from "@/components/repo-card";
import { getCategories, getLanguages, searchRepositories } from "@/lib/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    language?: string;
    category?: string;
    minStars?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const limit = 40;
  const [rows, languages, categories] = await Promise.all([
    searchRepositories({
      q: params.q,
      language: params.language,
      category: params.category,
      minStars: params.minStars ? Number(params.minStars) : undefined,
      limit,
      offset: (page - 1) * limit,
    }),
    getLanguages(),
    getCategories(),
  ]);

  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.language) qs.set("language", params.language);
  if (params.category) qs.set("category", params.category);
  if (params.minStars) qs.set("minStars", params.minStars);

  return (
    <div className="space-y-8">
      <SectionRule title="Repositories" kicker="Catalog" />
      <form className="grid gap-3 border border-[var(--rule)] bg-[var(--paper-elevated)] p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search name, owner, description…"
          className="border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-sans text-sm outline-none focus:border-[var(--ink)] lg:col-span-2"
        />
        <select
          name="language"
          defaultValue={params.language || ""}
          className="border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-sans text-sm"
        >
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l.language} value={l.language}>
              {l.language} ({l.count})
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={params.category || ""}
          className="border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-sans text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-[var(--paper)]"
        >
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No repositories matched these filters." />
      ) : (
        <div>
          {rows.map((repo) => (
            <RepoCard key={repo.repository_id} repo={repo} />
          ))}
        </div>
      )}

      <div className="flex justify-between font-sans text-xs uppercase tracking-[0.12em]">
        {page > 1 ? (
          <Link href={`/repositories?${qs.toString()}&page=${page - 1}`}>← Previous</Link>
        ) : (
          <span />
        )}
        {rows.length === limit ? (
          <Link href={`/repositories?${qs.toString()}&page=${page + 1}`}>Next →</Link>
        ) : null}
      </div>
    </div>
  );
}
