"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

export type SnapshotPoint = {
  capturedAt: string;
  stars: number | null;
  forks?: number | null;
};

type WindowKey = "7d" | "30d" | "90d" | "all";

const WINDOWS: { key: WindowKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "all", label: "ALL", days: null },
];

function formatStars(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

function formatTickDate(iso: string, spanDays: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (spanDays <= 3) {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
  }
  if (spanDays <= 45) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daySpan(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, (b - a) / 86_400_000);
}

type ChartRow = {
  t: number;
  iso: string;
  label: string;
  stars: number;
};

export function GrowthPanel({ snapshots }: { snapshots: SnapshotPoint[] }) {
  const [windowKey, setWindowKey] = useState<WindowKey>("all");

  const allPoints = useMemo(
    () =>
      snapshots
        .map((s) => {
          const stars = Number(s.stars);
          const t = new Date(s.capturedAt).getTime();
          return {
            iso: s.capturedAt,
            t,
            stars,
          };
        })
        .filter((s) => Number.isFinite(s.stars) && Number.isFinite(s.t))
        .sort((a, b) => a.t - b.t),
    [snapshots]
  );

  const windowDef = WINDOWS.find((w) => w.key === windowKey) ?? WINDOWS[3];

  const filtered = useMemo(() => {
    if (!allPoints.length) return [];
    if (windowDef.days == null) return allPoints;
    const cutoff = Date.now() - windowDef.days * 86_400_000;
    const inWindow = allPoints.filter((p) => p.t >= cutoff);
    // Keep one point just before the window so the line has context
    if (inWindow.length === 0) return [];
    const before = [...allPoints].reverse().find((p) => p.t < cutoff);
    return before ? [before, ...inWindow] : inWindow;
  }, [allPoints, windowDef.days]);

  const spanDays =
    filtered.length >= 2
      ? daySpan(filtered[0].iso, filtered[filtered.length - 1].iso)
      : 0;

  const chartRows: ChartRow[] = filtered.map((p) => ({
    t: p.t,
    iso: p.iso,
    label: formatTickDate(p.iso, Math.max(spanDays, 1)),
    stars: p.stars,
  }));

  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  const delta =
    first && last ? last.stars - first.stars : null;
  const pct =
    first && last && first.stars > 0
      ? ((last.stars - first.stars) / first.stars) * 100
      : null;

  const yDomain = useMemo((): [number, number] | ["auto", "auto"] => {
    if (filtered.length < 2) return ["auto", "auto"];
    const vals = filtered.map((p) => p.stars);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) {
      const pad = Math.max(min * 0.05, 10);
      return [Math.max(0, min - pad), max + pad];
    }
    const pad = (max - min) * 0.15;
    return [Math.max(0, min - pad), max + pad];
  }, [filtered]);

  // Sparse / short-span: prioritize readable delta over a flat chart
  const preferDeltaCard =
    filtered.length >= 2 && (filtered.length < 4 || spanDays < 2.5);

  if (allPoints.length === 0) {
    return (
      <div className="border border-dashed border-[var(--rule-strong)] px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
          Star tracking
        </p>
        <p className="mt-2 font-serif text-lg text-[var(--ink)]">No snapshots yet</p>
        <p className="mt-1 max-w-lg font-sans text-sm text-[var(--ink-muted)]">
          Growth over time starts after enrichment captures star counts. We
          don’t backfill GitHub history before the first scrape.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          Tracking since {formatFullDate(allPoints[0].iso)} · {allPoints.length}{" "}
          snapshot{allPoints.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
          {WINDOWS.map((w) => {
            const available =
              w.days == null
                ? allPoints.length
                : allPoints.filter(
                    (p) => p.t >= Date.now() - w.days! * 86_400_000
                  ).length;
            const disabled = w.days != null && available < 1;
            return (
              <button
                key={w.key}
                type="button"
                disabled={disabled}
                onClick={() => setWindowKey(w.key)}
                className={
                  windowKey === w.key
                    ? "text-[var(--signal)]"
                    : disabled
                      ? "cursor-not-allowed text-[var(--rule)]"
                      : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[var(--rule-strong)] px-4 py-6 font-sans text-sm text-[var(--ink-muted)]">
          No snapshots in the {windowDef.label} window yet. Try{" "}
          <button
            type="button"
            className="text-[var(--signal)] underline"
            onClick={() => setWindowKey("all")}
          >
            ALL
          </button>
          .
        </div>
      ) : filtered.length === 1 ? (
        <div className="border-2 border-[var(--rule-strong)] bg-[var(--paper-elevated)] px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Baseline · {windowDef.label}
          </p>
          <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-[var(--ink)]">
            ★ {formatStars(filtered[0].stars)}
          </p>
          <p className="mt-2 font-sans text-sm text-[var(--ink-muted)]">
            Only one snapshot in this window ({formatFullDate(filtered[0].iso)}
            ). A change needs at least two enrichment captures.
          </p>
        </div>
      ) : (
        <>
          {/* Always-visible change readout */}
          <div className="grid gap-px border-2 border-[var(--rule-strong)] bg-[var(--rule-strong)] sm:grid-cols-4">
            <Stat
              label="From"
              value={`★ ${formatStars(first!.stars)}`}
              hint={formatFullDate(first!.iso)}
            />
            <Stat
              label="To"
              value={`★ ${formatStars(last!.stars)}`}
              hint={formatFullDate(last!.iso)}
            />
            <Stat
              label="Change"
              value={
                delta == null
                  ? "—"
                  : `${delta >= 0 ? "+" : ""}${formatStars(delta)}`
              }
              hint={
                pct == null
                  ? undefined
                  : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
              }
              signal={pct != null && Math.abs(pct) >= 1}
            />
            <Stat
              label="Span"
              value={
                spanDays < 1
                  ? `${Math.round(spanDays * 24)}h`
                  : spanDays < 14
                    ? `${spanDays.toFixed(1)}d`
                    : `${Math.round(spanDays)}d`
              }
              hint={`${filtered.length} points`}
            />
          </div>

          {preferDeltaCard ? (
            <p className="font-sans text-sm text-[var(--ink-muted)]">
              Only {filtered.length} snapshots across{" "}
              {spanDays < 1
                ? `${Math.round(spanDays * 24)} hours`
                : `${spanDays.toFixed(1)} days`}
              . The delta above is the readable signal — a full curve needs a
              longer enrichment history.
            </p>
          ) : null}

          {/* Chart: zoomed Y domain so movement is visible */}
          <div className="h-72 w-full border border-[var(--rule-strong)] bg-[var(--paper-elevated)] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartRows}
                margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke="var(--rule)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                  stroke="var(--rule)"
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                  stroke="var(--rule)"
                  width={52}
                  tickFormatter={(v) => formatStars(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--paper-elevated)",
                    border: "1px solid var(--rule-strong)",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                  labelFormatter={(_, payload) => {
                    const iso = payload?.[0]?.payload?.iso as string | undefined;
                    return iso ? formatFullDate(iso) : "";
                  }}
                  formatter={(value) => [
                    `★ ${formatStars(typeof value === "number" ? value : Number(value))}`,
                    "Stars",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="stars"
                  stroke="var(--ink)"
                  strokeWidth={1.75}
                  dot={{ r: 3.5, fill: "var(--ink)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                {chartRows.length > 0 ? (
                  <ReferenceDot
                    x={chartRows[chartRows.length - 1].label}
                    y={chartRows[chartRows.length - 1].stars}
                    r={4}
                    fill="var(--signal)"
                    stroke="none"
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  signal,
}: {
  label: string;
  value: string;
  hint?: string;
  signal?: boolean;
}) {
  return (
    <div className="bg-[var(--paper)] px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        {label}
      </p>
      <p
        className={
          signal
            ? "mt-1 font-serif text-xl font-semibold tabular-nums text-[var(--signal)]"
            : "mt-1 font-serif text-xl font-semibold tabular-nums text-[var(--ink)]"
        }
      >
        {value}
      </p>
      {hint ? (
        <p
          className={
            signal
              ? "mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--signal)]"
              : "mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]"
          }
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Use GrowthPanel — kept for TimelineBars consumers */
export function GrowthChart({
  data,
}: {
  data: { date: string; stars?: number | null }[];
  metric?: "stars" | "forks" | "mentions";
}) {
  const snapshots: SnapshotPoint[] = data.map((d, i) => ({
    capturedAt: new Date(d.date).toISOString(),
    stars: d.stars ?? null,
  }));
  // Fallback if date parse fails — use index offsets
  snapshots.forEach((s, i) => {
    if (Number.isNaN(new Date(s.capturedAt).getTime())) {
      s.capturedAt = new Date(Date.now() - (data.length - i) * 86_400_000).toISOString();
    }
  });
  return <GrowthPanel snapshots={snapshots} />;
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
