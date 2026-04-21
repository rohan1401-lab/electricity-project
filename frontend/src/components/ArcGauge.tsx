import { cn } from "@/lib/utils";

interface Props {
  /** 0..100 */
  value: number;
  label?: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Semi-circular arc gauge matching the "Forecast Confidence" visual in frame
 * 1:479. Rotates the stroke offset to fill from left to right around the
 * top half of a circle. Pure SVG, no chart lib dependency.
 */
export function ArcGauge({
  value,
  label,
  subLabel,
  size = 180,
  strokeWidth = 14,
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - strokeWidth;
  // Half-circle path length = π·r
  const circumference = Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  const describeArc = (x: number, y: number, radius: number) => {
    // semicircle from (x - r, y) to (x + r, y), top half
    const startX = x - radius;
    const startY = y;
    const endX = x + radius;
    const endY = y;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        role="img"
        aria-label={`${clamped} percent`}
      >
        {/* track */}
        <path
          d={describeArc(cx, cy, r)}
          fill="none"
          stroke="var(--color-muted-line)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* fill */}
        <path
          d={describeArc(cx, cy, r)}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: "drop-shadow(0 0 8px var(--color-accent-glow40))",
            transition: "stroke-dashoffset 600ms ease",
          }}
        />
      </svg>
      <div className="mt-[-8px] flex flex-col items-center">
        <div className="display-number text-[length:var(--fs-30)]">
          {Math.round(clamped)}
          <span className="text-[length:var(--fs-14)] align-top ml-1">%</span>
        </div>
        {label ? <div className="label-mono">{label}</div> : null}
        {subLabel ? (
          <div className="label-mono text-[length:var(--fs-9)] mt-1">
            {subLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
