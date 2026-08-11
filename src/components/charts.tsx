"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Point = {
  date: string;
  stars?: number | null;
  forks?: number | null;
  mentions?: number | null;
  label?: string;
};

function formatStars(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

export function GrowthChart({
  data,
  metric = "stars",
}: {
  data: Point[];
  metric?: "stars" | "forks" | "mentions";
}) {
  const points = data.filter((d) => d[metric] != null);

  if (points.length === 0) {
    return (
      <div className="border border-dashed border-[var(--rule-strong)] px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
          Star tracking
        </p>
        <p className="mt-2 font-serif text-lg text-[var(--ink)]">
          No snapshots yet
        </p>
        <p className="mt-1 max-w-lg font-sans text-sm text-[var(--ink-muted)]">
          Growth curves appear after daily enrichment captures at least two
          star counts over time. We don’t invent history before the first
          scrape.
        </p>
      </div>
    );
  }

  if (points.length === 1) {
    const only = points[0];
    return (
      <div className="border-2 border-[var(--rule-strong)] bg-[var(--paper-elevated)] px-5 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
          Star tracking · baseline
        </p>
        <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-[var(--ink)]">
          ★ {formatStars(only[metric] as number)}
        </p>
        <p className="mt-2 font-sans text-sm text-[var(--ink-muted)]">
          First snapshot on <strong className="text-[var(--ink)]">{only.date}</strong>.
          A trend line needs a second enrichment pass — usually after the next
          daily scrape.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        Star snapshots · {points.length} points
      </p>
      <div className="h-72 w-full border border-[var(--rule-strong)] bg-[var(--paper-elevated)] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
              stroke="var(--rule)"
            />
            <YAxis
              tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
              stroke="var(--rule)"
              width={48}
              tickFormatter={(v) => formatStars(Number(v))}
            />
            <Tooltip
              contentStyle={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 0,
                fontSize: 12,
              }}
              formatter={(value) => [
                `★ ${formatStars(typeof value === "number" ? value : Number(value))}`,
                "Stars",
              ]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="var(--ink)"
              strokeWidth={1.5}
              dot={{ r: points.length < 8 ? 3 : 0, fill: "var(--ink)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TimelineBars({
  data,
}: {
  data: { discovery_date: string; repositories_discovered: number }[];
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.repositories_discovered), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.discovery_date} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
          <span className="font-mono text-xs text-[var(--ink-muted)]">
            {d.discovery_date}
          </span>
          <div className="h-2 bg-[var(--rule)]/40">
            <div
              className="h-2 bg-[var(--ink)]"
              style={{ width: `${(d.repositories_discovered / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-mono text-xs tabular-nums text-[var(--ink)]">
            {d.repositories_discovered}
          </span>
        </div>
      ))}
    </div>
  );
}
