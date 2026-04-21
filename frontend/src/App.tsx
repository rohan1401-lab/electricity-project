import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopShell } from "@/layouts/DesktopShell";
import { OverviewPage } from "@/pages/Overview";
import { ForecastPage } from "@/pages/Forecast";
import { SchedulerPage } from "@/pages/Scheduler";
import { ExplainPage } from "@/pages/Explain";
import { RobustnessPage } from "@/pages/Robustness";
import { StyleGuidePage } from "@/pages/StyleGuide";

export function App() {
  return (
    <Routes>
      <Route element={<DesktopShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="scheduler" element={<SchedulerPage />} />
        <Route path="explain" element={<ExplainPage />} />
        <Route path="robustness" element={<RobustnessPage />} />
        <Route path="style" element={<StyleGuidePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
