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
};

export function GrowthChart({
  data,
  metric = "stars",
}: {
  data: Point[];
  metric?: "stars" | "forks" | "mentions";
}) {
  if (!data.length) {
    return (
      <p className="border border-dashed border-[var(--rule)] px-4 py-10 text-center font-sans text-sm text-[var(--ink-muted)]">
        No historical snapshots yet. Snapshots are created during enrichment.
      </p>
    );
  }

  return (
    <div className="h-72 w-full border border-[var(--rule)] bg-[var(--paper-elevated)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#c9cdc4" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4a4f47", fontSize: 11 }}
            stroke="#c9cdc4"
          />
          <YAxis tick={{ fill: "#4a4f47", fontSize: 11 }} stroke="#c9cdc4" />
          <Tooltip
            contentStyle={{
              background: "#f5f6f2",
              border: "1px solid #c9cdc4",
              borderRadius: 0,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke="#171a16"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
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
