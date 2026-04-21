import { AlertTriangle, Battery, Car, Utensils } from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

import { GlassCard } from "@/components/GlassCard";
import { KpiTile } from "@/components/KpiTile";
import { Chip } from "@/components/Chip";
import { ArcGauge } from "@/components/ArcGauge";
import { formatCountdown, formatUsd, formatSignedPct } from "@/lib/format";
import { useCountdown } from "@/lib/useCountdown";
import { useOverviewSummary } from "@/api/overview";

/**
 * Overview page — pixel-faithful implementation of Figma frame 1:479
 * (see design/context/overview-1-479.md and design/figma-exports/body-1-479.*).
 *
 * Layout (from Figma, at 1280 px wide):
 *   - Top row: 4 KPI tiles (226×128 each, 24px gap)
 *   - Middle: 24h Energy Load Forecast line chart (full width)
 *   - Bottom row: 3 cards — Forecast Confidence gauge, Next Cheap Window
 *     countdown, Upcoming Runs list
 *
 * Uses `useOverviewSummary()` with TanStack Query — backend shape defined in
 * src/api/overview.ts and mirrored by backend/app/schemas/overview.py.
 */
export function OverviewPage() {
  const { data, isLoading, isError, error } = useOverviewSummary();

  if (isError) {
    return (
      <GlassCard>
        <div className="label-mono text-[var(--color-status-warning)]">
          Failed to load overview
        </div>
        <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-2">
          {(error as Error).message}
        </p>
      </GlassCard>
    );
  }

  const kpis = data?.kpis;
  const forecast = data?.forecast ?? [];
  const confidence = data?.confidence;
  const cheapWindow = data?.cheapWindow;
  const upcoming = data?.upcomingRuns ?? [];

  return (
    <div className="flex flex-col gap-[var(--space-6)] h-full">
      {/* ───────── KPI row ───────── */}
      <section
        className="flex flex-wrap gap-[var(--space-6)]"
        aria-label="Key performance indicators"
      >
        <KpiTile
          label="Today's Forecast Cost"
          value={kpis ? formatUsd(kpis.todaysForecastCostUsd) : "—"}
          suffix="USD"
        />
        <KpiTile
          label="Baseline Cost"
          value={kpis ? formatUsd(kpis.baselineCostUsd) : "—"}
          suffix="USD"
        />
        <KpiTile
          label="Savings %"
          value={kpis ? formatSignedPct(kpis.savingsPct) : "—"}
          chip={<Chip tone="accent">Optimized</Chip>}
        />
        <KpiTile
          variant="highlighted"
          label="Peak Hour"
          icon={
            <AlertTriangle
              size={16}
              className="text-[var(--color-status-warning)]"
              aria-hidden
            />
          }
          value={
            kpis ? (
              <span className="tabular-nums">
                {kpis.peakHourStart} – {kpis.peakHourEnd}
              </span>
            ) : (
              "—"
            )
          }
        />
      </section>

      {/* ───────── 24h Forecast ───────── */}
      <GlassCard
        className="p-[var(--space-6)]"
        aria-label="24 hour energy load forecast"
      >
        <div className="flex items-start justify-between mb-[var(--space-6)]">
          <div>
            <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight">
              24h Energy Load Forecast
            </h2>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1 max-w-[60ch]">
              Real-time predictive modeling based on grid demand and local PV generation.
            </p>
          </div>
          <div className="flex items-center gap-[var(--space-4)]">
            <LegendSwatch color="var(--color-accent-primary)" label="Forecast" />
            <LegendSwatch color="var(--color-status-warning)" label="Peak Load" />
          </div>
        </div>

        <div className="h-[260px] -mx-2">
          {isLoading || forecast.length === 0 ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="var(--color-muted-line)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background-elevated)",
                    border: "1px solid var(--color-accent-glow40)",
                    borderRadius: "8px",
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                    color: "var(--color-text-primary)",
                  }}
                  cursor={{ stroke: "var(--color-accent-glow40)" }}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="none"
                  fill="url(#forecastArea)"
                />
                <Line
                  type="monotone"
                  dataKey="peakLoad"
                  stroke="var(--color-status-warning)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--color-accent-primary)"
                  strokeWidth={2.5}
                  dot={false}
                  style={{ filter: "drop-shadow(0 0 6px var(--color-accent-glow40))" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* ───────── Bottom row ───────── */}
      <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] gap-[var(--space-6)] flex-1 min-h-0">
        {/* Confidence gauge */}
        <GlassCard className="flex flex-col items-center justify-center gap-[var(--space-4)] min-h-[220px]">
          <div className="label-mono">Forecast Confidence</div>
          {confidence ? (
            <ArcGauge
              value={confidence.percent}
              subLabel={`${confidence.stability} Stability`}
              size={180}
            />
          ) : (
            <div className="label-mono text-[var(--color-text-muted)]">Loading…</div>
          )}
        </GlassCard>

        {/* Cheap window countdown */}
        <CheapWindowCard
          cheapWindow={cheapWindow}
          loading={isLoading}
        />

        {/* Upcoming runs */}
        <GlassCard className="flex flex-col gap-[var(--space-4)]">
          <div className="label-mono">Upcoming Runs</div>
          <ul className="flex flex-col gap-[var(--space-4)]">
            {upcoming.length === 0 && !isLoading ? (
              <li className="text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
                No scheduled runs.
              </li>
            ) : null}
            {upcoming.map((run) => (
              <li key={run.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {iconForAppliance(run.appliance)}
                    <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] text-[var(--color-text-primary)]">
                      {run.appliance}
                    </span>
                  </div>
                  <span className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)]">
                    {formatUsd(run.estCostUsd)} est.
                  </span>
                </div>
                <ProgressBar value={run.progressPct} />
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}

// ───────── sub-components ─────────

function CheapWindowCard({
  cheapWindow,
  loading,
}: {
  cheapWindow?: {
    startsAt: string;
    endsAt: string;
    projectedRateUsdPerKwh: number;
  };
  loading: boolean;
}) {
  const secondsRemaining = useCountdown(
    cheapWindow?.startsAt ?? new Date().toISOString()
  );
  return (
    <GlassCard className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center justify-between">
        <div className="label-mono">Next Cheap Window</div>
        <div className="w-6 h-6 rounded-full border border-[var(--color-accent-glow40)] grid place-items-center text-[var(--color-accent-primary)] text-[10px] font-mono">
          ⏱
        </div>
      </div>

      <div className="display-number text-[length:var(--fs-36)] tabular-nums">
        {loading || !cheapWindow ? "—" : formatCountdown(secondsRemaining)}
      </div>

      <div className="label-mono text-[length:var(--fs-9)]">
        Countdown to Start
      </div>

      <div className="pt-[var(--space-3)] border-t border-[var(--color-muted-line)] flex flex-col gap-1">
        <Row
          label="Time Range:"
          value={
            cheapWindow
              ? `${new Date(cheapWindow.startsAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} – ${new Date(cheapWindow.endsAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "—"
          }
        />
        <Row
          label="Projected Rate:"
          value={
            cheapWindow
              ? `$${cheapWindow.projectedRateUsdPerKwh.toFixed(2)}/kWh`
              : "—"
          }
        />
      </div>

      <button
        type="button"
        className="mt-auto w-full rounded-md py-[var(--space-3)] bg-[var(--color-accent-glow10)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase hover:bg-[var(--color-accent-glow20)] transition"
      >
        Queue Automated Tasks
      </button>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[length:var(--fs-12)]">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono text-[var(--color-text-primary)] tabular-nums">
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-pill bg-[var(--color-muted-soft-alt)] overflow-hidden">
      <div
        className="h-full rounded-pill bg-[var(--color-accent-primary)]"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          boxShadow: "0 0 8px var(--color-accent-glow40)",
        }}
      />
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-xs"
        style={{ background: color }}
        aria-hidden
      />
      <span className="label-mono text-[length:var(--fs-9)]">{label}</span>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="w-full h-full rounded-md animate-pulse"
      style={{
        background:
          "linear-gradient(90deg, var(--color-muted-soft) 0%, var(--color-muted-soft-alt) 50%, var(--color-muted-soft) 100%)",
      }}
    />
  );
}

function iconForAppliance(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("ev") || lower.includes("car"))
    return <Car size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  if (lower.includes("dish") || lower.includes("oven"))
    return <Utensils size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  return <Battery size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
}
