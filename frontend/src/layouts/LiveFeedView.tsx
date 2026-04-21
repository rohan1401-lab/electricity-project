import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  RadioTower,
  Waves,
  Zap,
} from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import { Chip } from "@/components/Chip";

/**
 * Streaming ops log shown when the user switches the TopBar tab to "Live Feed".
 * Populated by a local `setInterval` that replays the `SEED_EVENTS` cycle —
 * stand-in for a future WebSocket feed from the solver + forecast workers.
 */

type Severity = "info" | "success" | "warning" | "critical";

interface FeedEvent {
  id: number;
  timestamp: Date;
  source: "FORECAST" | "SCHEDULER" | "GRID" | "MODEL" | "TARIFF";
  severity: Severity;
  message: string;
  detail?: string;
}

const SEED_EVENTS: Array<Omit<FeedEvent, "id" | "timestamp">> = [
  {
    source: "FORECAST",
    severity: "info",
    message: "XGBoost forecast refreshed — 24h horizon",
    detail: "MAE 0.128 kWh/h · sMAPE 11.4%",
  },
  {
    source: "SCHEDULER",
    severity: "success",
    message: "MILP solver returned OPTIMAL (82 ms)",
    detail: "5 loads scheduled · £3.42/day optimised",
  },
  {
    source: "GRID",
    severity: "warning",
    message: "Tariff band crossover in 00:45:00",
    detail: "SHOULDER → PEAK · threshold 16:00",
  },
  {
    source: "MODEL",
    severity: "info",
    message: "Residual quantile band recalibrated",
    detail: "P10–P90 width −7.3% vs last window",
  },
  {
    source: "TARIFF",
    severity: "info",
    message: "Cheap window detected · 02:00 → 06:00",
    detail: "£0.05/kWh · 4h contiguous",
  },
  {
    source: "SCHEDULER",
    severity: "success",
    message: "Dishwasher queued · start 03:00",
    detail: "OFF_PEAK · £0.08 est.",
  },
  {
    source: "FORECAST",
    severity: "warning",
    message: "Weather feed latency 1.8s above SLA",
    detail: "shortwave_radiation stale · fallback used",
  },
  {
    source: "GRID",
    severity: "critical",
    message: "Peak draw >2.1 kW — HVAC throttled",
    detail: "thermal reserve retained · no user impact",
  },
  {
    source: "MODEL",
    severity: "success",
    message: "SHAP explainer warm-cache hit",
    detail: "local attribution in 12 ms",
  },
  {
    source: "SCHEDULER",
    severity: "info",
    message: "EV charger plan stable · 02:00 → 06:00",
    detail: "solver delta vs prior: 0",
  },
];

export function LiveFeedView() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    // Initial burst — the last three seed events so the viewport isn't empty
    const now = Date.now();
    const initial: FeedEvent[] = SEED_EVENTS.slice(-3).map((e, i) => ({
      ...e,
      id: counterRef.current++,
      timestamp: new Date(now - (2 - i) * 4000),
    }));
    setEvents(initial);

    const id = window.setInterval(() => {
      const next = SEED_EVENTS[counterRef.current % SEED_EVENTS.length];
      setEvents((prev) =>
        [
          {
            ...next,
            id: counterRef.current++,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 40)
      );
    }, 2500);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-[var(--space-6)] h-full">
      {/* header strip */}
      <div className="flex items-center justify-between flex-wrap gap-[var(--space-4)]">
        <div>
          <div className="label-mono">Stream · Live</div>
          <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight">
            Neural Grid Live Feed
          </h2>
          <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1 max-w-[72ch]">
            Real-time log of solver events, forecast refreshes, tariff band
            crossovers, and grid draw anomalies. Sourced from the FastAPI
            worker pool — placeholder timer until the WebSocket lands.
          </p>
        </div>
        <div className="flex items-center gap-[var(--space-3)]">
          <Chip tone="accent">
            <span className="inline-block w-1.5 h-1.5 rounded-pill bg-[var(--color-accent-primary)] mr-1.5 animate-pulse" />
            Online
          </Chip>
          <Chip tone="muted">{events.length} events</Chip>
        </div>
      </div>

      {/* event stream */}
      <GlassCard className="flex-1 flex flex-col gap-[var(--space-3)] overflow-hidden min-h-0">
        <div className="flex items-center justify-between">
          <div className="label-mono">Event Stream</div>
          <RadioTower size={14} className="text-[var(--color-text-muted)]" aria-hidden />
        </div>
        <ul className="flex-1 overflow-y-auto flex flex-col gap-[var(--space-2)] pr-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
          {events.length === 0 && (
            <li className="label-mono">Waiting for first event…</li>
          )}
        </ul>
      </GlassCard>
    </div>
  );
}

function EventRow({ event }: { event: FeedEvent }) {
  const tone = severityTone(event.severity);
  return (
    <li
      className={
        "rounded-md border-l-2 bg-[var(--color-muted-soft)] px-[var(--space-4)] py-[var(--space-3)] grid grid-cols-[88px_140px_1fr_auto] items-center gap-[var(--space-4)] " +
        tone.border
      }
    >
      <span className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)] tabular-nums">
        {formatClock(event.timestamp)}
      </span>
      <span className="flex items-center gap-2">
        {sourceIcon(event.source)}
        <span className="label-mono">{event.source}</span>
      </span>
      <span className="flex flex-col">
        <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] text-[var(--color-text-primary)]">
          {event.message}
        </span>
        {event.detail && (
          <span className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)]">
            {event.detail}
          </span>
        )}
      </span>
      <span className="justify-self-end">
        <Chip tone={tone.chip}>{event.severity}</Chip>
      </span>
    </li>
  );
}

function severityTone(sev: Severity): {
  border: string;
  chip: "accent" | "muted" | "warning" | "danger";
} {
  switch (sev) {
    case "success":
      return { border: "border-[var(--color-accent-primary)]", chip: "accent" };
    case "warning":
      return { border: "border-[var(--color-status-warning)]", chip: "warning" };
    case "critical":
      return { border: "border-[var(--color-status-danger)]", chip: "danger" };
    default:
      return { border: "border-[var(--color-muted-line)]", chip: "muted" };
  }
}

function sourceIcon(src: FeedEvent["source"]) {
  const cls = "text-[var(--color-text-muted)]";
  switch (src) {
    case "FORECAST":
      return <Waves size={13} className={cls} aria-hidden />;
    case "SCHEDULER":
      return <Gauge size={13} className={cls} aria-hidden />;
    case "GRID":
      return <Zap size={13} className={cls} aria-hidden />;
    case "MODEL":
      return <Cpu size={13} className={cls} aria-hidden />;
    case "TARIFF":
      return <CheckCircle2 size={13} className={cls} aria-hidden />;
    default:
      return <AlertTriangle size={13} className={cls} aria-hidden />;
  }
}

function formatClock(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
