import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "warning" | "muted" | "danger";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const toneClass: Record<Tone, string> = {
  accent:
    "bg-[var(--color-accent-glow20)] text-[var(--color-accent-primary)] border border-[var(--color-accent-glow40)]",
  warning:
    "bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)] border border-[var(--color-status-warning-edge)]",
  muted:
    "bg-[var(--color-muted-soft)] text-[var(--color-text-muted)] border border-[var(--color-muted-line)]",
  danger:
    "bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)] border border-[var(--color-status-danger)]",
};

export function Chip({ tone = "accent", className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 font-mono text-[length:var(--fs-9)] font-medium tracking-widest uppercase",
        toneClass[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
