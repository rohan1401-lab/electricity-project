import { AlertTriangle, Zap } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { KpiTile } from "@/components/KpiTile";
import { Chip } from "@/components/Chip";
import { ArcGauge } from "@/components/ArcGauge";

/**
 * Living design-system page. Renders every primitive used across the app so
 * token drift and regression can be caught visually. Token values here come
 * from CSS custom properties, never hand-written.
 */
export function StyleGuidePage() {
  return (
    <div className="flex flex-col gap-[var(--space-8)]">
      <header>
        <div className="label-mono">Section · 01</div>
        <h1 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-36)] font-bold text-[var(--color-text-primary)] tracking-tight">
          Style Guide
        </h1>
        <p className="text-[length:var(--fs-14)] text-[var(--color-text-muted)] mt-1 max-w-[72ch]">
          Every primitive in the HEMS UI. Tokens sourced from{" "}
          <code className="font-mono">design/figma-tokens.json</code>, generated
          via <code className="font-mono">scripts/generate-tokens.mjs</code>.
        </p>
      </header>

      {/* Colors */}
      <Section title="Colors">
        <ColorGrid
          label="Background"
          vars={[
            "--color-background-base",
            "--color-background-elevated",
            "--color-background-glass",
            "--color-background-overlay",
          ]}
        />
        <ColorGrid
          label="Accent"
          vars={[
            "--color-accent-primary",
            "--color-accent-primary-alt",
            "--color-accent-pressed",
            "--color-accent-dark",
            "--color-accent-halo",
            "--color-accent-glow20",
            "--color-accent-glow40",
          ]}
        />
        <ColorGrid
          label="Text"
          vars={[
            "--color-text-primary",
            "--color-text-secondary",
            "--color-text-muted",
            "--color-text-disabled",
            "--color-text-on-accent",
          ]}
        />
        <ColorGrid
          label="Status"
          vars={[
            "--color-status-warning",
            "--color-status-warning-soft",
            "--color-status-danger",
            "--color-status-danger-fg",
          ]}
        />
      </Section>

      {/* Type scale */}
      <Section title="Type scale">
        <GlassCard className="flex flex-col gap-4">
          {(["9", "10", "12", "14", "16", "18", "20", "24", "30", "36"] as const).map(
            (sz) => (
              <div key={sz} className="flex items-baseline gap-6">
                <span className="label-mono w-16">fs-{sz}</span>
                <span
                  className="text-[var(--color-text-primary)]"
                  style={{ fontSize: `var(--fs-${sz})` }}
                >
                  HEMS · energy that answers to you
                </span>
              </div>
            )
          )}
        </GlassCard>
      </Section>

      {/* Font families */}
      <Section title="Font families">
        <div className="grid grid-cols-3 gap-[var(--space-4)]">
          <GlassCard>
            <div className="label-mono mb-2">Display</div>
            <div className="font-[family-name:var(--ff-display)] text-[length:var(--fs-30)] font-bold">
              Space Grotesk
            </div>
          </GlassCard>
          <GlassCard>
            <div className="label-mono mb-2">Body</div>
            <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-20)]">
              Inter — the quick brown fox
            </div>
          </GlassCard>
          <GlassCard>
            <div className="label-mono mb-2">Mono</div>
            <div className="font-mono text-[length:var(--fs-18)] tracking-widest uppercase">
              JetBrains_Mono
            </div>
          </GlassCard>
        </div>
      </Section>

      {/* Card variants */}
      <Section title="Glass card variants">
        <div className="grid grid-cols-3 gap-[var(--space-4)]">
          <GlassCard variant="default">
            <div className="label-mono mb-2">Default Surface</div>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
              Standard container using blur (12px) and 10% outline variant at
              10% opacity. For primary data modules.
            </p>
          </GlassCard>
          <GlassCard variant="highlighted">
            <div className="flex items-center justify-between mb-2">
              <div className="label-mono">Highlighted Focus</div>
              <Chip tone="accent">Active Focus</Chip>
            </div>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
              Enhanced container with top-left radial glow and primary border.
              Used for critical alerts or active states.
            </p>
          </GlassCard>
          <GlassCard variant="muted">
            <div className="label-mono mb-2">Muted Surface</div>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
              De-prioritized container for background elements or historical
              data in an inactive state.
            </p>
          </GlassCard>
        </div>
      </Section>

      {/* KPI tiles */}
      <Section title="KPI tiles">
        <div className="flex flex-wrap gap-[var(--space-4)]">
          <KpiTile label="Today's Forecast Cost" value="£14.20" suffix="GBP" />
          <KpiTile
            label="Savings %"
            value="+23.2%"
            chip={<Chip tone="accent">Optimized</Chip>}
          />
          <KpiTile
            variant="highlighted"
            label="Peak Hour"
            icon={
              <AlertTriangle
                size={16}
                className="text-[var(--color-status-warning)]"
              />
            }
            value="18:00 – 19:00"
          />
        </div>
      </Section>

      {/* Arc gauge */}
      <Section title="Arc gauge">
        <GlassCard className="flex items-center gap-[var(--space-8)]">
          <ArcGauge value={92} subLabel="High Stability" />
          <ArcGauge value={63} subLabel="Moderate Stability" />
          <ArcGauge value={21} subLabel="Low Stability" />
        </GlassCard>
      </Section>

      {/* Chips */}
      <Section title="Chips">
        <GlassCard className="flex flex-wrap gap-[var(--space-3)]">
          <Chip tone="accent">Optimized</Chip>
          <Chip tone="accent">Active Focus</Chip>
          <Chip tone="warning">Tariff High</Chip>
          <Chip tone="muted">Tariff Norm</Chip>
          <Chip tone="danger">Shutdown</Chip>
        </GlassCard>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <GlassCard className="flex flex-wrap gap-[var(--space-3)] items-center">
          <button
            type="button"
            className="rounded-md px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2"
          >
            <Zap size={12} strokeWidth={2.5} />
            Upgrade Capacity
          </button>
          <button
            type="button"
            className="rounded-md px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-accent-glow10)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase hover:bg-[var(--color-accent-glow20)] transition"
          >
            Queue Automated Tasks
          </button>
          <button
            type="button"
            className="rounded-md px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase hover:brightness-110 transition"
          >
            Emergency Shutdown
          </button>
        </GlassCard>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-4)]">
      <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-18)] font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorGrid({ label, vars }: { label: string; vars: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="label-mono">{label}</div>
      <div className="flex flex-wrap gap-[var(--space-3)]">
        {vars.map((v) => (
          <div
            key={v}
            className="rounded-md border border-[var(--color-muted-line)] overflow-hidden w-[180px]"
          >
            <div
              className="h-16 w-full"
              style={{ background: `var(${v})` }}
              aria-hidden
            />
            <div className="p-2 bg-[var(--color-background-elevated)]">
              <div className="font-mono text-[length:var(--fs-9)] text-[var(--color-text-muted)] truncate">
                {v}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
