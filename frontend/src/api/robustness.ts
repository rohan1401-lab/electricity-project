import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

/** Matches `backend/app/routers/robustness.py` → `/robustness/metrics`. */
export interface NoiseMetricsResponse {
  columns: string[];
  rows: Array<Record<string, number | string>>;
}

export function useRobustnessMetrics() {
  return useQuery({
    queryKey: ["robustness", "metrics"] as const,
    queryFn: async () => {
      const { data } = await api.get<NoiseMetricsResponse>("/robustness/metrics");
      return data;
    },
  });
}
