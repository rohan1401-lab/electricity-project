import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Glass container — the primary surface primitive. Three variants drawn from
 * the Figma style-guide frame (1:696):
 *   - default     → Default_Surface: 12px blur, 70% dark fill, subtle line
 *   - highlighted → Highlighted_Focus: radial accent glow + primary border
 *   - muted       → Muted_Surface: dimmed, for inactive / historical data
 */
export type GlassVariant = "default" | "highlighted" | "muted";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
}

export const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { className, variant = "default", ...rest },
  ref
) {
  const variantClass = {
    default:
      "bg-[var(--color-background-glass)] border border-[var(--color-muted-line)] backdrop-blur-md",
    highlighted:
      "bg-[var(--color-background-glass)] border border-[var(--color-accent-primary)] backdrop-blur-md shadow-accent-glow " +
      "before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(120%_80%_at_0%_0%,var(--color-accent-halo)_0%,transparent_60%)] before:pointer-events-none",
    muted:
      "bg-[var(--color-muted-soft-alt)] border border-[var(--color-muted-line)] backdrop-blur-md opacity-70",
  }[variant];

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-lg p-6 text-[var(--color-text-primary)]",
        variantClass,
        className
      )}
      {...rest}
    />
  );
});
