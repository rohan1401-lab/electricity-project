import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

/**
 * Scheduler contract (placeholder — `backend/app/routers/scheduler.py`).
 *
 * `POST /scheduler/plan` runs the MILP solver (OR-Tools) over today's tariff
 * curve. The response shape mirrors the solver output: a list of appliance
 * runs with start/end times, the chosen tariff band, and the optimized vs
 * baseline cost breakdown. When the dedicated schema lands this file will be
 * updated in lock-step with `scheduler_service.solve_schedule`.
 */
export interface ScheduleRun {
  id: string;
  appliance: string;
  startsAt: string;   // ISO
  endsAt: string;     // ISO
  kwh: number;
  costUsd: number;
  tariffBand: "OFF_PEAK" | "SHOULDER" | "PEAK";
}

export interface ConstraintSpec {
  appliance: string;
  earliest: string;   // HH:MM
  latest: string;     // HH:MM
  durationMin: number;
  quietHours?: [string, string];
}

export interface ScheduleSummary {
  runs: ScheduleRun[];
  constraints: ConstraintSpec[];
  optimizedCostUsd: number;
  baselineCostUsd: number;
  savingsPct: number;
  peakShiftedKwh: number;
  solverStatus: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE";
  solverMs: number;
}

export function usePlanSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ScheduleSummary>("/scheduler/plan");
      return data;
    },
    onSuccess: (data) => qc.setQueryData(["scheduler", "latest"], data),
  });
}

export function useLatestSchedule() {
  return useQuery<ScheduleSummary | undefined>({
    queryKey: ["scheduler", "latest"],
    queryFn: async () => undefined,
    enabled: false,
  });
}
