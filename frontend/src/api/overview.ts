import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

/** Matches backend/app/schemas/overview.py */
export interface OverviewKpis {
  todaysForecastCostUsd: number;
  baselineCostUsd: number;
  savingsPct: number;
  peakHourStart: string; // "18:00"
  peakHourEnd: string;   // "19:00"
}

export interface ForecastConfidence {
  percent: number;       // 92
  stability: "LOW" | "MODERATE" | "HIGH";
}

export interface CheapWindow {
  startsAt: string;      // ISO
  endsAt: string;        // ISO
  projectedRateUsdPerKwh: number;
}

export interface UpcomingRun {
  id: string;
  appliance: string;     // "EV Charger"
  estCostUsd: number;
  progressPct: number;   // 0..100
}

export interface ForecastPoint {
  time: string;          // "00:00"
  forecast: number;      // kWh
  peakLoad: number;      // kWh
}

export interface OverviewSummary {
  kpis: OverviewKpis;
  forecast: ForecastPoint[];
  confidence: ForecastConfidence;
  cheapWindow: CheapWindow;
  upcomingRuns: UpcomingRun[];
}

export const overviewKeys = {
  summary: ["overview", "summary"] as const,
};

export function useOverviewSummary() {
  return useQuery({
    queryKey: overviewKeys.summary,
    queryFn: async () => {
      const { data } = await api.get<OverviewSummary>("/overview/summary");
      return data;
    },
  });
}
