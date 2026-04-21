import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

/**
 * Matches backend/app/routers/forecast.py (placeholder shape).
 * Each point comes from `sample_forecast.parquet` and carries the observed
 * (actual) kWh, the XGBoost point forecast, and the reference tariff used
 * to build the cost curve on the Overview page.
 */
export interface ForecastPoint {
  timestamp: string; // ISO
  forecast: number;  // kWh
  actual: number;    // kWh (may be NaN on future horizon)
  price: number;     // £/kWh
}

export interface ForecastResponse {
  horizon_h: number;
  points: ForecastPoint[];
}

export function useForecast(horizonH = 24) {
  return useQuery({
    queryKey: ["forecast", horizonH] as const,
    queryFn: async () => {
      const { data } = await api.get<ForecastResponse>("/forecast", {
        params: { horizon_h: horizonH },
      });
      return data;
    },
  });
}
