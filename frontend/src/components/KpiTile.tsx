import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard, type GlassVariant } from "./GlassCard";

interface Props {
  label: string;
  value: ReactNode;
  suffix?: string;
  chip?: ReactNode;
  icon?: ReactNode;
  variant?: GlassVariant;
  className?: string;
}

/**
 * KPI tile — top-row metric card. Dimensions from Figma (226 × 128).
 * Layout: small uppercase mono label, bold display number (+ optional suffix),
 * optional chip or icon slot.
 */
export function KpiTile({
  label,
  value,
  suffix,
  chip,
  icon,
  variant = "default",
  className,
}: Props) {
  return (
    <GlassCard
      variant={variant}
      className={cn(
        "flex flex-col justify-between flex-1 min-w-[220px] h-[var(--shell-kpi-tile-height)] p-[var(--space-6-5)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="label-mono leading-tight">{label}</div>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="display-number leading-none">{value}</div>
        {suffix ? (
          <span className="label-mono text-[length:var(--fs-9)]">{suffix}</span>
        ) : null}
        {chip}
      </div>
    </GlassCard>
  );
}
