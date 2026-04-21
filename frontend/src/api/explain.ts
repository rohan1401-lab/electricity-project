import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

/** Matches `backend/app/routers/explain.py` → `/explain/shap?top=N`. */
export interface ShapFeature {
  name: string;
  importance: number; // mean |SHAP| across test set
}

export interface ShapResponse {
  features: ShapFeature[];
}

export function useShapTopFeatures(top = 12) {
  return useQuery({
    queryKey: ["explain", "shap", top] as const,
    queryFn: async () => {
      const { data } = await api.get<ShapResponse>("/explain/shap", {
        params: { top },
      });
      return data;
    },
  });
}
