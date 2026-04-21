import { useEffect, useState } from "react";

/** Counts down to `target` (ISO string or Date), returning seconds remaining. */
export function useCountdown(target: Date | string) {
  const targetMs =
    typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return Math.max(0, Math.floor((targetMs - now) / 1000));
}
