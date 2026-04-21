import { Construction } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface Props {
  pageName: string;
}

/**
 * Placeholder shown on routes that have no Figma design yet. Uses the same
 * token system as designed pages so the shell feels complete end-to-end.
 */
export function DesignPendingCard({ pageName }: Props) {
  return (
    <GlassCard className="flex flex-col items-center justify-center text-center min-h-[320px] gap-4">
      <Construction
        className="text-[var(--color-accent-primary)]"
        size={40}
        strokeWidth={1.5}
      />
      <div className="label-mono text-[length:var(--fs-10)]">
        Module / {pageName.toUpperCase()}
      </div>
      <div className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)]">
        Design Pending
      </div>
      <p className="max-w-[48ch] text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
        This route is wired to the shell and uses the shared design tokens,
        but its Figma frame has not been produced yet. Once the frame exists
        in <code className="font-mono">energy-dashboard</code>, this stub is
        replaced with a pixel-faithful implementation.
      </p>
    </GlassCard>
  );
}
