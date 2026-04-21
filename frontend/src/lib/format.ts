/** USD currency formatter, 2 decimals. */
export const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

/** Signed percentage — `+23.2%` / `-4.1%`. */
export const formatSignedPct = (n: number, digits = 1) => {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
};

/** HH:MM from a Date or ISO string. */
export const formatHm = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

/** Zero-padded HH:MM:SS from total seconds. */
export const formatCountdown = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
};
