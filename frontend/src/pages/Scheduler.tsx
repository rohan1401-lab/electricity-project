import {
  CalendarClock,
  Car,
  Clock,
  DollarSign,
  Flame,
  Gauge,
  Moon,
  Play,
  RefreshCw,
  ShirtIcon,
  Utensils,
  Zap,
} from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import { KpiTile } from "@/components/KpiTile";
import { Chip } from "@/components/Chip";
import {
  usePlanSchedule,
  type ConstraintSpec,
  type ScheduleRun,
  type ScheduleSummary,
} from "@/api/scheduler";

/**
 * Scheduler page — realises Objective 3.10 of `docs/Rohan_Proposal.docx` (an
 * OR-Tools MILP scheduler that respects hard user-comfort constraints) and
 * the scheduler half of Section 1 of `docs/FYP_Data_Pipeline_Report.docx`.
 *
 * Data source: `usePlanSchedule()` → `POST /scheduler/plan`. The backend
 * route is still a stub, so the page renders a static fallback plan until
 * the solver returns a live response — the UI then swaps over on the next
 * successful `mutateAsync()`.
 */
export function SchedulerPage() {
  const planMutation = usePlanSchedule();
  const liveSummary = planMutation.data;

  const summary: ScheduleSummary = liveSummary ?? FALLBACK_SUMMARY;
  const isLive = liveSummary !== undefined;

  const replan = () => {
    planMutation.mutateAsync().catch(() => {
      /* swallow — fallback data is still shown */
    });
  };

  return (
    <div className="flex flex-col gap-[var(--space-6)] h-full">
      {/* ───────── KPI row ───────── */}
      <section
        className="flex flex-wrap gap-[var(--space-6)]"
        aria-label="Scheduler key metrics"
      >
        <KpiTile
          label="Optimised Cost"
          value={`$${summary.optimizedCostUsd.toFixed(2)}`}
          suffix="GBP / day"
          icon={
            <DollarSign
              size={16}
              className="text-[var(--color-accent-primary)]"
              aria-hidden
            />
          }
        />
        <KpiTile
          label="Baseline Cost"
          value={`$${summary.baselineCostUsd.toFixed(2)}`}
          suffix="GBP / day"
        />
        <KpiTile
          label="Savings %"
          value={`${summary.savingsPct >= 0 ? "+" : ""}${summary.savingsPct.toFixed(1)}%`}
          chip={
            <Chip tone={summary.savingsPct >= 15 ? "accent" : "warning"}>
              {summary.savingsPct >= 15 ? "Target Met" : "Below Target"}
            </Chip>
          }
        />
        <KpiTile
          variant="highlighted"
          label="Solver Status"
          value={summary.solverStatus}
          suffix={`${summary.solverMs} ms`}
          icon={
            <Gauge
              size={16}
              className="text-[var(--color-accent-primary)]"
              aria-hidden
            />
          }
        />
      </section>

      {/* ───────── Gantt timeline ───────── */}
      <GlassCard
        className="p-[var(--space-6)]"
        aria-label="24 hour appliance schedule"
      >
        <div className="flex items-start justify-between mb-[var(--space-6)] gap-4 flex-wrap">
          <div>
            <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight">
              24h Appliance Schedule · MILP
            </h2>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1 max-w-[72ch]">
              Google OR-Tools CP-SAT solver assigns each deferrable load to a
              start window that minimises total energy cost, subject to the
              hard user-comfort constraints listed below.
              {!isLive && (
                <>
                  {" "}
                  <span className="text-[var(--color-text-muted)]">
                    Showing illustrative plan — press{" "}
                    <span className="text-[var(--color-accent-primary)]">Re-plan</span>{" "}
                    to hit the live solver.
                  </span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={replan}
            disabled={planMutation.isPending}
            className="flex items-center gap-2 rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-accent-glow10)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase hover:bg-[var(--color-accent-glow20)] transition disabled:opacity-60"
          >
            {planMutation.isPending ? (
              <RefreshCw size={12} strokeWidth={2.5} className="animate-spin" aria-hidden />
            ) : (
              <Play size={12} strokeWidth={2.5} aria-hidden />
            )}
            {planMutation.isPending ? "Solving…" : "Re-plan"}
          </button>
        </div>

        {/* legend */}
        <div className="flex items-center gap-[var(--space-6)] mb-[var(--space-4)]">
          <BandSwatch label="Off-Peak" band="OFF_PEAK" />
          <BandSwatch label="Shoulder" band="SHOULDER" />
          <BandSwatch label="Peak" band="PEAK" />
        </div>

        {/* tariff ribbon */}
        <div className="flex h-[10px] rounded-pill overflow-hidden mb-[var(--space-3)]">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex-1"
              style={{ background: tariffRibbonColor(tariffBandForHour(h)) }}
            />
          ))}
        </div>

        {/* gantt rows */}
        <div className="relative flex flex-col gap-[var(--space-2)]">
          {summary.runs.map((run) => (
            <GanttRow key={run.id} run={run} />
          ))}

          {/* hour guide lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, transparent 0, transparent calc(100%/24 - 1px), var(--color-muted-line) calc(100%/24 - 1px), var(--color-muted-line) calc(100%/24))",
            }}
          />
        </div>

        {/* hour axis */}
        <div className="relative mt-[var(--space-4)] h-6 pl-[160px]">
          <div className="relative w-full h-full">
            {HOUR_TICKS.map((h) => (
              <div
                key={h}
                className="absolute top-0 label-mono text-[length:var(--fs-12)] tabular-nums"
                style={{ left: `${(h / 24) * 100}%`, transform: "translateX(-50%)" }}
              >
                {String(h).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ───────── Footer: constraints + runs table ───────── */}
      <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-[var(--space-6)] flex-1 min-h-0">
        <GlassCard className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div className="label-mono">User Constraints · Hard</div>
            <Clock size={14} className="text-[var(--color-text-muted)]" aria-hidden />
          </div>
          <p className="text-[length:var(--fs-10)] text-[var(--color-text-muted)] -mt-2">
            Non-negotiable comfort windows per <code className="font-mono">docs/Rohan_Proposal.docx</code>§3.10.
          </p>
          <ul className="flex flex-col gap-[var(--space-3)]">
            {summary.constraints.map((c) => (
              <ConstraintRow key={c.appliance} c={c} />
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div className="label-mono">Scheduled Runs</div>
            <CalendarClock size={14} className="text-[var(--color-text-muted)]" aria-hidden />
          </div>
          <RunsTable runs={summary.runs} />
        </GlassCard>
      </section>
    </div>
  );
}

// ───────── sub-components ─────────

function GanttRow({ run }: { run: ScheduleRun }) {
  const startHour = hourFromIso(run.startsAt);
  const endHour = hourFromIso(run.endsAt);
  const duration = Math.max(0.5, endHour - startHour);
  const left = (startHour / 24) * 100;
  const width = (duration / 24) * 100;
  const color = runBlockColor(run.tariffBand);

  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-[var(--space-3)]">
      <div className="flex items-center gap-2 min-w-0">
        {iconForAppliance(run.appliance)}
        <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] text-[var(--color-text-primary)] truncate">
          {run.appliance}
        </span>
      </div>

      <div className="relative h-11 rounded-md bg-[var(--color-muted-soft)] border border-[var(--color-muted-line)]">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-9 rounded-md border flex items-center px-2 overflow-hidden"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            background: color.bg,
            borderColor: color.border,
            boxShadow: `0 0 10px ${color.glow}`,
          }}
        >
          <span className="font-mono text-[length:var(--fs-10)] tracking-widest uppercase text-[var(--color-text-primary)] whitespace-nowrap">
            {formatHm(run.startsAt)}–{formatHm(run.endsAt)} · ${run.costUsd.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConstraintRow({ c }: { c: ConstraintSpec }) {
  const hasQuiet = Boolean(c.quietHours);
  return (
    <li
      className={
        "rounded-md border-l-2 pl-[var(--space-4)] py-[var(--space-3)] pr-[var(--space-3)] " +
        (hasQuiet
          ? "border-[var(--color-status-warning)] bg-[var(--color-status-warning-soft)]"
          : "border-[var(--color-muted-line)] bg-[var(--color-muted-soft)]")
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {iconForAppliance(c.appliance)}
          <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)]">
            {c.appliance}
          </span>
        </div>
        <span className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)] tabular-nums">
          {c.earliest}–{c.latest}
        </span>
      </div>
      <div className="flex items-center gap-4 pl-7 mt-1.5">
        <span className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
          dur {c.durationMin}m
        </span>
        {hasQuiet && (
          <span className="flex items-center gap-1.5 font-mono text-[length:var(--fs-12)] text-[var(--color-status-warning)]">
            <Moon size={12} aria-hidden /> quiet {c.quietHours![0]}–{c.quietHours![1]}
          </span>
        )}
      </div>
    </li>
  );
}

function RunsTable({ runs }: { runs: ScheduleRun[] }) {
  return (
    <div className="rounded-md border border-[var(--color-muted-line)] overflow-hidden">
      <div className="grid grid-cols-[1.3fr_1.2fr_0.7fr_0.8fr_0.8fr] label-mono bg-[var(--color-muted-soft)] px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--color-muted-line)]">
        <span>Appliance</span>
        <span>Window</span>
        <span className="text-right">kWh</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Band</span>
      </div>
      {runs.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[1.3fr_1.2fr_0.7fr_0.8fr_0.8fr] items-center gap-2 px-[var(--space-4)] py-[var(--space-4)] border-b last:border-b-0 border-[var(--color-muted-line)] text-[length:var(--fs-14)]"
        >
          <span className="flex items-center gap-2 text-[var(--color-text-primary)]">
            {iconForAppliance(r.appliance)}
            <span className="truncate">{r.appliance}</span>
          </span>
          <span className="font-mono text-[var(--color-text-muted)] tabular-nums text-[length:var(--fs-12)]">
            {formatHm(r.startsAt)}–{formatHm(r.endsAt)}
          </span>
          <span className="font-mono text-right text-[var(--color-accent-primary)] tabular-nums">
            {r.kwh.toFixed(1)}
          </span>
          <span className="font-mono text-right text-[var(--color-text-primary)] tabular-nums">
            ${r.costUsd.toFixed(2)}
          </span>
          <span className="flex justify-end">
            <Chip tone={bandChipTone(r.tariffBand)}>{bandLabel(r.tariffBand)}</Chip>
          </span>
        </div>
      ))}
    </div>
  );
}

function BandSwatch({ label, band }: { label: string; band: ScheduleRun["tariffBand"] }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-4 h-4 rounded-xs"
        style={{ background: tariffRibbonColor(band) }}
        aria-hidden
      />
      <span className="label-mono text-[length:var(--fs-12)]">{label}</span>
    </div>
  );
}

// ───────── helpers ─────────

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

function tariffBandForHour(h: number): ScheduleRun["tariffBand"] {
  if (h < 7) return "OFF_PEAK";
  if (h < 16) return "SHOULDER";
  if (h < 21) return "PEAK";
  return "OFF_PEAK";
}

function tariffRibbonColor(band: ScheduleRun["tariffBand"]): string {
  switch (band) {
    case "OFF_PEAK":
      return "color-mix(in srgb, var(--color-accent-primary) 35%, transparent)";
    case "SHOULDER":
      return "color-mix(in srgb, var(--color-accent-primary-alt) 55%, transparent)";
    case "PEAK":
      return "color-mix(in srgb, var(--color-status-warning) 80%, transparent)";
  }
}

function runBlockColor(band: ScheduleRun["tariffBand"]): {
  bg: string;
  border: string;
  glow: string;
} {
  switch (band) {
    case "OFF_PEAK":
      return {
        bg: "var(--color-accent-glow20)",
        border: "var(--color-accent-primary)",
        glow: "var(--color-accent-glow40)",
      };
    case "SHOULDER":
      return {
        bg: "var(--color-accent-glow10)",
        border: "var(--color-accent-primary-alt)",
        glow: "var(--color-accent-glow30)",
      };
    case "PEAK":
      return {
        bg: "var(--color-status-warning-soft)",
        border: "var(--color-status-warning)",
        glow: "var(--color-status-warning-edge)",
      };
  }
}

function bandChipTone(band: ScheduleRun["tariffBand"]): "accent" | "muted" | "warning" {
  if (band === "OFF_PEAK") return "accent";
  if (band === "SHOULDER") return "muted";
  return "warning";
}

function bandLabel(band: ScheduleRun["tariffBand"]): string {
  return band === "OFF_PEAK" ? "Off-Peak" : band === "SHOULDER" ? "Shoulder" : "Peak";
}

function hourFromIso(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

function formatHm(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function iconForAppliance(name: string) {
  const n = name.toLowerCase();
  if (n.includes("ev") || n.includes("car"))
    return <Car size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  if (n.includes("dish"))
    return <Utensils size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  if (n.includes("wash"))
    return <ShirtIcon size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  if (n.includes("dry"))
    return <ShirtIcon size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  if (n.includes("heater") || n.includes("hvac") || n.includes("heat"))
    return <Flame size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
  return <Zap size={14} className="text-[var(--color-text-muted)]" aria-hidden />;
}

// ───────── fallback dataset ─────────

/**
 * Illustrative schedule used until `POST /scheduler/plan` returns live data.
 * Cost breakdown and per-run numbers are plausible for a 5-load UK household
 * on a 3-tier TOU tariff; bands match `tariffBandForHour` above.
 */
const _isoToday = (h: number, m = 0): string => {
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};

const FALLBACK_SUMMARY: ScheduleSummary = {
  optimizedCostUsd: 3.42,
  baselineCostUsd: 4.81,
  savingsPct: 28.9,
  peakShiftedKwh: 12.4,
  solverStatus: "OPTIMAL",
  solverMs: 84,
  runs: [
    {
      id: "dishwasher",
      appliance: "Dishwasher",
      startsAt: _isoToday(3),
      endsAt: _isoToday(5),
      kwh: 1.1,
      costUsd: 0.08,
      tariffBand: "OFF_PEAK",
    },
    {
      id: "washing_machine",
      appliance: "Washing Machine",
      startsAt: _isoToday(4),
      endsAt: _isoToday(6),
      kwh: 0.9,
      costUsd: 0.07,
      tariffBand: "OFF_PEAK",
    },
    {
      id: "ev_charger",
      appliance: "EV Charger",
      startsAt: _isoToday(2),
      endsAt: _isoToday(6),
      kwh: 11.2,
      costUsd: 0.84,
      tariffBand: "OFF_PEAK",
    },
    {
      id: "water_heater",
      appliance: "Water Heater",
      startsAt: _isoToday(13),
      endsAt: _isoToday(14),
      kwh: 2.1,
      costUsd: 0.23,
      tariffBand: "SHOULDER",
    },
    {
      id: "tumble_dryer",
      appliance: "Tumble Dryer",
      startsAt: _isoToday(5),
      endsAt: _isoToday(7),
      kwh: 2.4,
      costUsd: 0.18,
      tariffBand: "OFF_PEAK",
    },
  ],
  constraints: [
    {
      appliance: "Dishwasher",
      earliest: "06:00",
      latest: "23:00",
      durationMin: 120,
      quietHours: ["23:00", "06:00"],
    },
    {
      appliance: "Washing Machine",
      earliest: "07:00",
      latest: "22:00",
      durationMin: 180,
      quietHours: ["22:00", "07:00"],
    },
    {
      appliance: "EV Charger",
      earliest: "00:00",
      latest: "23:00",
      durationMin: 240,
    },
    {
      appliance: "Water Heater",
      earliest: "06:00",
      latest: "21:00",
      durationMin: 60,
    },
    {
      appliance: "Tumble Dryer",
      earliest: "07:00",
      latest: "22:00",
      durationMin: 120,
      quietHours: ["22:00", "07:00"],
    },
  ],
};

