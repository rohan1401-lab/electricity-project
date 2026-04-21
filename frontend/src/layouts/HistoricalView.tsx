import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Target, TrendingDown, TrendingUp } from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import { KpiTile } from "@/components/KpiTile";
import { Chip } from "@/components/Chip";

/**
 * 30-day historical view — small-multiple charts of daily forecast error (MAE)
 * and realised savings %. Used when the user switches the TopBar tab to
 * "Historical". Illustrative series until the backend exposes a
 * `/historical/daily` endpoint.
 */

interface DailyRow {
  day: string; // "MM-DD"
  mae: number;
  smape: number;
  savingsPct: number;
  baselineCost: number;
  optimisedCost: number;
}

const MAE_TARGET = 0.15;
const SAVINGS_TARGET = 15;

export function HistoricalView() {
  const rows = useMemo(() => buildRows(30), []);

  const avgMae = mean(rows.map((r) => r.mae));
  const avgSavings = mean(rows.map((r) => r.savingsPct));
  const daysOnTarget = rows.filter(
    (r) => r.mae < MAE_TARGET && r.savingsPct >= SAVINGS_TARGET
  ).length;
  const cumBaseline = rows.reduce((a, r) => a + r.baselineCost, 0);
  const cumOptimised = rows.reduce((a, r) => a + r.optimisedCost, 0);
  const cumSavingsUsd = cumBaseline - cumOptimised;

  return (
    <div className="flex flex-col gap-[var(--space-6)] h-full">
      {/* header */}
      <div>
        <div className="label-mono">Window · 30 days</div>
        <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight">
          Historical Performance
        </h2>
        <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1 max-w-[72ch]">
          Daily forecast error and realised tariff savings against the
          FYP-proposal targets of MAE &lt; 0.15 kWh/h and &gt;15% cost reduction.
        </p>
      </div>

      {/* KPI row */}
      <section className="flex flex-wrap gap-[var(--space-6)]">
        <KpiTile
          label="Avg MAE · 30d"
          value={avgMae.toFixed(3)}
          suffix="kWh/h"
          chip={
            <Chip tone={avgMae < MAE_TARGET ? "accent" : "warning"}>
              {avgMae < MAE_TARGET ? "On Target" : "Over Target"}
            </Chip>
          }
          icon={
            <Target size={16} className="text-[var(--color-accent-primary)]" aria-hidden />
          }
        />
        <KpiTile
          label="Avg Savings · 30d"
          value={`${avgSavings.toFixed(1)}%`}
          chip={
            <Chip tone={avgSavings >= SAVINGS_TARGET ? "accent" : "warning"}>
              {avgSavings >= SAVINGS_TARGET ? "Above 15%" : "Below 15%"}
            </Chip>
          }
          icon={
            <TrendingDown
              size={16}
              className="text-[var(--color-accent-primary)]"
              aria-hidden
            />
          }
        />
        <KpiTile
          label="Days On Target"
          value={`${daysOnTarget}`}
          suffix={`of ${rows.length}`}
          icon={
            <CalendarDays
              size={16}
              className="text-[var(--color-text-muted)]"
              aria-hidden
            />
          }
        />
        <KpiTile
          variant="highlighted"
          label="Cumulative Savings"
          value={`$${cumSavingsUsd.toFixed(2)}`}
          suffix="GBP · 30d"
          icon={
            <TrendingUp
              size={16}
              className="text-[var(--color-accent-primary)]"
              aria-hidden
            />
          }
        />
      </section>

      {/* Small multiples */}
      <section className="grid grid-cols-2 gap-[var(--space-6)] flex-1 min-h-0">
        <GlassCard className="p-[var(--space-6)] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-[var(--space-3)]">
            <div>
              <div className="label-mono">Daily Forecast Error</div>
              <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
                Mean Absolute Error · kWh/h
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="maeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="var(--color-muted-line)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                  tick={{
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  domain={[0.08, 0.22]}
                  tick={{
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "var(--color-accent-glow40)" }}
                  formatter={(v: number) => [`${v.toFixed(3)} kWh/h`, "MAE"]}
                />
                <ReferenceLine
                  y={MAE_TARGET}
                  stroke="var(--color-text-muted)"
                  strokeDasharray="4 4"
                  label={{
                    value: "0.15 target",
                    position: "insideTopRight",
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mae"
                  stroke="none"
                  fill="url(#maeArea)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke="var(--color-accent-primary)"
                  strokeWidth={2}
                  dot={false}
                  style={{ filter: "drop-shadow(0 0 6px var(--color-accent-glow40))" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-[var(--space-6)] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-[var(--space-3)]">
            <div>
              <div className="label-mono">Realised Savings</div>
              <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
                Daily % cost reduction vs baseline
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="savArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-primary-alt)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent-primary-alt)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="var(--color-muted-line)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                  tick={{
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  domain={[0, 40]}
                  tick={{
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "var(--color-accent-glow40)" }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Savings"]}
                />
                <ReferenceLine
                  y={SAVINGS_TARGET}
                  stroke="var(--color-text-muted)"
                  strokeDasharray="4 4"
                  label={{
                    value: "15% target",
                    position: "insideTopRight",
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="savingsPct"
                  stroke="none"
                  fill="url(#savArea)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="savingsPct"
                  stroke="var(--color-accent-primary-alt)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-background-elevated)",
  border: "1px solid var(--color-accent-glow40)",
  borderRadius: 8,
  fontFamily: "JetBrains Mono",
  fontSize: 11,
  color: "var(--color-text-primary)",
};

/** Deterministic pseudo-random series so the chart is stable across renders. */
function buildRows(days: number): DailyRow[] {
  const out: DailyRow[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const seed = d.getDate() + d.getMonth() * 31;
    const noise = pseudo(seed);
    const mae = 0.118 + Math.sin(seed / 3) * 0.018 + noise * 0.02;
    const smape = 10.2 + Math.cos(seed / 4) * 1.6 + noise * 1.2;
    const savingsPct = 22 + Math.sin(seed / 5 + 1) * 6 + noise * 4;
    const baselineCost = 4.5 + Math.sin(seed / 6) * 0.7 + noise * 0.3;
    const optimisedCost = baselineCost * (1 - savingsPct / 100);
    out.push({
      day: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      mae: Number(mae.toFixed(4)),
      smape: Number(smape.toFixed(2)),
      savingsPct: Number(savingsPct.toFixed(2)),
      baselineCost: Number(baselineCost.toFixed(3)),
      optimisedCost: Number(optimisedCost.toFixed(3)),
    });
  }
  return out;
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}
