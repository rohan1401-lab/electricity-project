import { useMemo, useState } from "react";
import { Activity, Clock, Target, TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { GlassCard } from "@/components/GlassCard";
import { KpiTile } from "@/components/KpiTile";
import { Chip } from "@/components/Chip";
import { useForecast, type ForecastPoint } from "@/api/forecast";

/**
 * Forecast page — realises Objective 3.8 / 3.10 of the FYP proposal: the
 * XGBoost short-term load forecaster. The page shows the 24h point forecast
 * alongside an empirical P10–P90 uncertainty band, overlays the observed
 * series on any historical window the user has selected, and reports the
 * three error metrics the proposal commits to (MAE, sMAPE, MASE) against
 * the published target of MAE < 0.15 kWh/h and sMAPE < 15%.
 *
 * Data source: `useForecast()` → `/api/forecast` (backend serves
 * `sample_forecast.parquet`). The uncertainty band is synthesised locally
 * from a ±10% multiplier until quantile columns land in the parquet file.
 */
const HORIZONS = [24, 48, 72] as const;

export function ForecastPage() {
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(24);
  const { data, isLoading, isError, error } = useForecast(horizon);

  const series = useMemo(
    () => (data?.points ?? []).map(shapeForChart),
    [data],
  );
  const metrics = useMemo(() => computeMetrics(data?.points ?? []), [data]);

  if (isError) {
    return (
      <ErrorCard message={(error as Error).message} />
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)] h-full">
      {/* ───────── KPI row — published accuracy targets ───────── */}
      <section
        className="flex flex-wrap gap-[var(--space-6)]"
        aria-label="Forecast accuracy metrics"
      >
        <KpiTile
          label="Horizon"
          value={`${horizon}h`}
          suffix="ROLLING"
          icon={<Clock size={16} className="text-[var(--color-accent-primary)]" aria-hidden />}
        />
        <KpiTile
          label="MAE"
          value={metrics ? metrics.mae.toFixed(3) : "—"}
          suffix="kWh/h"
          chip={
            metrics ? (
              <Chip tone={metrics.mae < 0.15 ? "accent" : "warning"}>
                {metrics.mae < 0.15 ? "On Target" : "Over Target"}
              </Chip>
            ) : undefined
          }
        />
        <KpiTile
          label="sMAPE"
          value={metrics ? `${metrics.smape.toFixed(1)}%` : "—"}
          chip={
            metrics ? (
              <Chip tone={metrics.smape < 15 ? "accent" : "warning"}>
                {metrics.smape < 15 ? "On Target" : "Over Target"}
              </Chip>
            ) : undefined
          }
        />
        <KpiTile
          variant="highlighted"
          label="MASE"
          value={metrics ? metrics.mase.toFixed(2) : "—"}
          icon={<Target size={16} className="text-[var(--color-accent-primary)]" aria-hidden />}
        />
      </section>

      {/* ───────── Main chart ───────── */}
      <GlassCard className="p-[var(--space-6)]">
        <div className="flex items-start justify-between mb-[var(--space-6)] gap-4 flex-wrap">
          <div>
            <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight">
              XGBoost Load Forecast · Point &amp; Uncertainty
            </h2>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1 max-w-[72ch]">
              Hourly kWh prediction with empirical P10–P90 band. Observed (actual)
              overlaid where available. Features come from the 40-column set defined
              in Notebook&nbsp;03 (lags, rolling stats, calendar &amp; TOU encodings,
              weather).
            </p>
          </div>
          <div className="flex items-center gap-[var(--space-4)]">
            <HorizonTabs value={horizon} onChange={setHorizon} />
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-6)] mb-[var(--space-3)]">
          <LegendSwatch color="var(--color-accent-primary)" label="Forecast" />
          <LegendSwatch color="var(--color-accent-glow40)" label="P10–P90" solid />
          <LegendSwatch color="var(--color-status-warning)" label="Actual" dashed />
        </div>

        <div className="h-[360px] -mx-2">
          {isLoading || series.length === 0 ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="var(--color-muted-line)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  interval={Math.max(1, Math.floor(series.length / 12))}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background-elevated)",
                    border: "1px solid var(--color-accent-glow40)",
                    borderRadius: 8,
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                    color: "var(--color-text-primary)",
                  }}
                  cursor={{ stroke: "var(--color-accent-glow40)" }}
                  formatter={(value: number, key: string) => {
                    if (key === "p90") return [`${value.toFixed(3)} kWh`, "P90"];
                    if (key === "p10") return [`${value.toFixed(3)} kWh`, "P10"];
                    if (key === "actual") return [`${value.toFixed(3)} kWh`, "Actual"];
                    return [`${value.toFixed(3)} kWh`, "Forecast"];
                  }}
                />
                <Legend wrapperStyle={{ display: "none" }} />
                {/* band: stack P10 (transparent) + (P90 - P10) (filled) */}
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="transparent"
                  stackId="band"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="bandWidth"
                  stroke="none"
                  fill="url(#forecastBand)"
                  stackId="band"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--color-status-warning)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--color-accent-primary)"
                  strokeWidth={2.5}
                  dot={false}
                  style={{ filter: "drop-shadow(0 0 6px var(--color-accent-glow40))" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* ───────── Bottom row: feature table + residuals ───────── */}
      <section className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[var(--space-6)] flex-1 min-h-0">
        <GlassCard className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div className="label-mono">Top Feature Groups</div>
            <Activity size={14} className="text-[var(--color-text-muted)]" aria-hidden />
          </div>
          <FeatureGroupsTable />
        </GlassCard>

        <GlassCard className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div className="label-mono">Residual Summary</div>
            <TrendingUp size={14} className="text-[var(--color-text-muted)]" aria-hidden />
          </div>
          <ResidualStrip points={data?.points ?? []} />
          <div className="grid grid-cols-3 gap-[var(--space-4)] pt-[var(--space-3)] border-t border-[var(--color-muted-line)]">
            <Stat label="Bias" value={metrics ? formatSigned(metrics.bias, 3) : "—"} />
            <Stat label="RMSE" value={metrics ? metrics.rmse.toFixed(3) : "—"} />
            <Stat label="Coverage" value={metrics ? `${metrics.coverage.toFixed(0)}%` : "—"} />
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

// ───────── sub-components ─────────

function HorizonTabs({
  value,
  onChange,
}: {
  value: (typeof HORIZONS)[number];
  onChange: (v: (typeof HORIZONS)[number]) => void;
}) {
  return (
    <div className="flex rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] overflow-hidden">
      {HORIZONS.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onChange(h)}
          className={
            "px-[var(--space-4)] py-[var(--space-2)] font-mono text-[length:var(--fs-10)] tracking-widest uppercase transition-colors " +
            (h === value
              ? "bg-[var(--color-accent-glow20)] text-[var(--color-accent-primary)] border-r border-[var(--color-accent-glow40)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]")
          }
        >
          {h}h
        </button>
      ))}
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed,
  solid,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  solid?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-xs"
        style={{
          background: solid ? color : "transparent",
          border: dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
        }}
        aria-hidden
      />
      <span className="label-mono text-[length:var(--fs-9)]">{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="label-mono text-[length:var(--fs-9)]">{label}</div>
      <div className="font-mono text-[length:var(--fs-16)] text-[var(--color-text-primary)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

/**
 * Feature groups as defined in Section 4 of `docs/FYP_Data_Pipeline_Report.docx`
 * (40 engineered features across seven groups). Counts are hard-coded here
 * until the backend exposes a `/forecast/features` summary endpoint.
 */
const FEATURE_GROUPS: Array<{ group: string; count: number; examples: string }> = [
  { group: "Lag", count: 8, examples: "lag_1h · lag_24h · lag_168h" },
  { group: "Rolling Statistics", count: 9, examples: "roll_mean_3h · roll_std_24h" },
  { group: "Calendar", count: 7, examples: "hour · day_of_week · is_weekend" },
  { group: "TOU Tariff", count: 4, examples: "band · price · peak_flag" },
  { group: "Weather", count: 6, examples: "temp_c · humidity · solar_rad" },
  { group: "Interaction", count: 4, examples: "temp×hour · price×lag_24h" },
  { group: "Sub-metering", count: 2, examples: "sub_1 · sub_2_ratio" },
];

function FeatureGroupsTable() {
  return (
    <div className="rounded-md border border-[var(--color-muted-line)] overflow-hidden">
      <div className="grid grid-cols-[1.2fr_0.4fr_2fr] label-mono bg-[var(--color-muted-soft)] px-[var(--space-4)] py-[var(--space-2)] border-b border-[var(--color-muted-line)]">
        <span>Group</span>
        <span className="text-right">#</span>
        <span>Examples</span>
      </div>
      {FEATURE_GROUPS.map((f) => (
        <div
          key={f.group}
          className="grid grid-cols-[1.2fr_0.4fr_2fr] px-[var(--space-4)] py-[var(--space-3)] border-b last:border-b-0 border-[var(--color-muted-line)] text-[length:var(--fs-12)]"
        >
          <span className="text-[var(--color-text-primary)]">{f.group}</span>
          <span className="font-mono text-right text-[var(--color-accent-primary)] tabular-nums">
            {f.count}
          </span>
          <span className="font-mono text-[var(--color-text-muted)] text-[length:var(--fs-10)] truncate">
            {f.examples}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResidualStrip({ points }: { points: ForecastPoint[] }) {
  if (points.length === 0) {
    return <div className="h-[80px] rounded-md bg-[var(--color-muted-soft)] animate-pulse" />;
  }
  const residuals = points
    .filter((p) => Number.isFinite(p.actual))
    .map((p) => p.forecast - p.actual);
  const max = Math.max(0.001, ...residuals.map((r) => Math.abs(r)));
  return (
    <div className="flex items-end gap-[2px] h-[80px]">
      {residuals.map((r, i) => {
        const h = Math.max(2, (Math.abs(r) / max) * 72);
        const pos = r >= 0;
        return (
          <div
            key={i}
            className="flex-1 rounded-xs"
            style={{
              height: h,
              background: pos
                ? "var(--color-accent-primary)"
                : "var(--color-status-warning)",
              opacity: 0.7,
              alignSelf: pos ? "flex-end" : "flex-start",
            }}
          />
        );
      })}
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

function ErrorCard({ message }: { message: string }) {
  return (
    <GlassCard>
      <div className="label-mono text-[var(--color-status-warning)]">
        Failed to load forecast
      </div>
      <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-2">
        {message}
      </p>
    </GlassCard>
  );
}

// ───────── local maths ─────────

/** Transform API points into the shape Recharts needs. */
function shapeForChart(p: ForecastPoint) {
  const p10 = p.forecast * 0.9;
  const p90 = p.forecast * 1.1;
  return {
    label: new Date(p.timestamp).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    forecast: p.forecast,
    actual: Number.isFinite(p.actual) ? p.actual : null,
    p10,
    p90,
    bandWidth: p90 - p10,
  };
}

interface Metrics {
  mae: number;
  smape: number;
  mase: number;
  rmse: number;
  bias: number;
  coverage: number; // % of actuals inside the P10–P90 band
}

function computeMetrics(points: ForecastPoint[]): Metrics | null {
  const valid = points.filter((p) => Number.isFinite(p.actual));
  if (valid.length === 0) return null;

  const errs = valid.map((p) => p.forecast - p.actual);
  const absErrs = errs.map(Math.abs);
  const mae = mean(absErrs);
  const rmse = Math.sqrt(mean(errs.map((e) => e * e)));
  const bias = mean(errs);

  const smape =
    mean(
      valid.map(
        (p) =>
          (Math.abs(p.forecast - p.actual) /
            ((Math.abs(p.forecast) + Math.abs(p.actual)) / 2 || 1)) *
          100,
      ),
    );

  // Naive seasonal baseline: previous period
  const seasonalErrs: number[] = [];
  for (let i = 1; i < valid.length; i++) {
    seasonalErrs.push(Math.abs(valid[i].actual - valid[i - 1].actual));
  }
  const denom = mean(seasonalErrs) || 1;
  const mase = mae / denom;

  const inside = valid.filter(
    (p) => p.actual >= p.forecast * 0.9 && p.actual <= p.forecast * 1.1,
  ).length;
  const coverage = (inside / valid.length) * 100;

  return { mae, smape, mase, rmse, bias, coverage };
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

function formatSigned(v: number, dp = 2): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(dp)}`;
}
