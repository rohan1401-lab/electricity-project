import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  Bell,
  Calendar,
  Check,
  Command,
  CreditCard,
  Globe,
  HelpCircle,
  Keyboard,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";

import { Chip } from "@/components/Chip";
import { cn } from "@/lib/utils";

export type ModalId =
  | "profile"
  | "settings"
  | "notifications"
  | "help"
  | "upgrade"
  | "signout"
  | null;

interface Props {
  id: ModalId;
  onClose: () => void;
  onSignOut: () => void;
  user: {
    username: string;
    displayName: string;
    role: string;
    email: string;
    initials: string;
  };
}

export function AppModal({ id, onClose, onSignOut, user }: Props) {
  // Close on Escape
  useEffect(() => {
    if (id === null) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [id, onClose]);

  if (id === null) return null;

  const { title, subtitle, icon: Icon, body, width } = getModal(id, user, onSignOut, onClose);

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-[var(--color-background-overlay)] backdrop-blur-sm p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] overflow-hidden rounded-md border border-[var(--color-accent-glow40)] bg-[var(--color-background-elevated)] shadow-accent-glow flex flex-col"
        style={{ width: `min(${width}px, 95vw)` }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 p-[var(--space-6)] border-b border-[var(--color-muted-line)]">
          <div className="flex items-center gap-[var(--space-4)] min-w-0">
            <div className="grid place-items-center w-12 h-12 rounded-md bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] shrink-0">
              <Icon size={22} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="modal-title"
                className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-tight truncate"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] text-[var(--color-text-muted)] mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid place-items-center w-10 h-10 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-glow5)] transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-[var(--space-6)]">{body}</div>
      </div>
    </div>
  );
}

// ───────── router ─────────

function getModal(
  id: Exclude<ModalId, null>,
  user: Props["user"],
  onSignOut: () => void,
  onClose: () => void
) {
  switch (id) {
    case "profile":
      return {
        title: user.displayName,
        subtitle: `@${user.username} · ${user.role}`,
        icon: User,
        width: 600,
        body: <ProfileBody user={user} />,
      };
    case "settings":
      return {
        title: "Account Settings",
        subtitle: "Personalise how ENERGY_OPS behaves for you",
        icon: Sparkles,
        width: 640,
        body: <SettingsBody />,
      };
    case "notifications":
      return {
        title: "Notifications",
        subtitle: "Scheduling alerts and system events",
        icon: Bell,
        width: 620,
        body: <NotificationsBody />,
      };
    case "help":
      return {
        title: "Help & Shortcuts",
        subtitle: "Get the most out of the HEMS dashboard",
        icon: HelpCircle,
        width: 620,
        body: <HelpBody />,
      };
    case "upgrade":
      return {
        title: "Upgrade Capacity",
        subtitle: "Unlock higher-tier forecasting and scheduling",
        icon: BatteryCharging,
        width: 720,
        body: <UpgradeBody onClose={onClose} />,
      };
    case "signout":
      return {
        title: "Sign Out",
        subtitle: "You will need to sign in again to continue",
        icon: LogOut,
        width: 460,
        body: <SignOutBody onConfirm={onSignOut} onClose={onClose} user={user} />,
      };
  }
}

// ───────── Profile ─────────

function ProfileBody({ user }: { user: Props["user"] }) {
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center gap-[var(--space-4)]">
        <div className="grid place-items-center w-20 h-20 rounded-full bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono font-bold text-[length:var(--fs-30)] shrink-0">
          {user.initials}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)] leading-none">
              {user.displayName}
            </h3>
            <Chip tone="accent">VERIFIED</Chip>
          </div>
          <div className="font-mono text-[length:var(--fs-14)] text-[var(--color-accent-primary)]">
            @{user.username}
          </div>
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono text-[length:var(--fs-12)]">
            <Mail size={14} aria-hidden /> {user.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-4)]">
        <StatCard label="Role" value={user.role} icon={ShieldCheck} />
        <StatCard label="Member Since" value="Oct 2025" icon={Calendar} />
        <StatCard label="Primary Home" value="Konstanz · DE" icon={MapPin} />
        <StatCard label="Tariff" value="London TOU · 3-Tier" icon={Zap} />
      </div>

      <div className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] p-[var(--space-4)]">
        <div className="label-mono mb-2">Lifetime Savings</div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono font-bold text-[length:var(--fs-30)] text-[var(--color-accent-primary)] tabular-nums">
            $1,247.83
          </span>
          <span className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
            across 184 scheduling runs
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof User;
}) {
  return (
    <div className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] p-[var(--space-4)] flex items-center gap-3">
      <Icon size={20} className="text-[var(--color-accent-primary)] shrink-0" aria-hidden />
      <div className="flex flex-col min-w-0">
        <div className="label-mono text-[length:var(--fs-10)]">{label}</div>
        <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)] truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// ───────── Settings ─────────

function SettingsBody() {
  const [darkMode, setDarkMode] = useState(true);
  const [autoReplan, setAutoReplan] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <SettingsGroup title="Appearance">
        <Toggle
          icon={Moon}
          label="Dark mode"
          description="Currently the only mode. Light theme lands in a future release."
          value={darkMode}
          onChange={setDarkMode}
          disabled
        />
        <Toggle
          icon={Zap}
          label="Reduced motion"
          description="Disables transitions, animations and particle effects."
          value={reducedMotion}
          onChange={setReducedMotion}
        />
      </SettingsGroup>

      <SettingsGroup title="Scheduling">
        <Toggle
          icon={Sparkles}
          label="Auto re-plan at midnight"
          description="Re-runs the MILP solver every day at 00:05 using the latest forecast."
          value={autoReplan}
          onChange={setAutoReplan}
        />
      </SettingsGroup>

      <SettingsGroup title="Notifications">
        <Toggle
          icon={Bell}
          label="In-app notifications"
          description="Scheduling windows, cheap-window alerts, solver failures."
          value={pushEnabled}
          onChange={setPushEnabled}
        />
        <Toggle
          icon={Mail}
          label="Daily email digest"
          description="Summary of yesterday's savings, peak shifts and upcoming windows."
          value={emailDigest}
          onChange={setEmailDigest}
        />
      </SettingsGroup>

      <SettingsGroup title="Locale">
        <SelectRow
          icon={Globe}
          label="Language"
          value="English (United Kingdom)"
        />
        <SelectRow
          icon={MapPin}
          label="Time zone"
          value="Europe/London · GMT"
        />
      </SettingsGroup>
    </div>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="label-mono">{title}</div>
      <div className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] divide-y divide-[var(--color-muted-line)]">
        {children}
      </div>
    </div>
  );
}

function Toggle({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  icon: typeof User;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-[var(--space-4)] p-[var(--space-4)]">
      <Icon
        size={20}
        className="text-[var(--color-accent-primary)] shrink-0"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)]">
          {label}
        </div>
        <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-12)] text-[var(--color-text-muted)] leading-snug">
          {description}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-12 h-7 rounded-pill transition-colors border shrink-0",
          value
            ? "bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]"
            : "bg-[var(--color-muted-soft-alt)] border-[var(--color-muted-line)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform",
            value
              ? "translate-x-5 bg-[var(--color-text-on-accent)]"
              : "translate-x-0 bg-[var(--color-text-primary)]"
          )}
        />
      </button>
    </div>
  );
}

function SelectRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-[var(--space-4)] p-[var(--space-4)] hover:bg-[var(--color-accent-glow5)] transition-colors text-left"
    >
      <Icon size={20} className="text-[var(--color-accent-primary)] shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)]">
          {label}
        </div>
        <div className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
          {value}
        </div>
      </div>
    </button>
  );
}

// ───────── Notifications ─────────

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: "accent" | "warning" | "muted";
  icon: typeof Bell;
  unread: boolean;
}

const NOTIFICATIONS_SEED: NotificationItem[] = [
  {
    id: "sched-tonight",
    title: "Schedule your EV charger tonight",
    body: "Tomorrow's cheap window starts 02:00 – 06:00 at $0.05/kWh. Queue a 4h run now to save ~$1.18.",
    time: "just now",
    tone: "accent",
    icon: BatteryCharging,
    unread: true,
  },
  {
    id: "dishwasher",
    title: "Dishwasher run ready to queue",
    body: "You haven't queued a dishwasher cycle today. The cheapest 2h window is 03:00 – 05:00.",
    time: "12 min ago",
    tone: "accent",
    icon: Calendar,
    unread: true,
  },
  {
    id: "peak-alert",
    title: "Peak tariff band starts in 45 min",
    body: "16:00 – 21:00 will be PEAK price. Consider pausing discretionary loads.",
    time: "1 hour ago",
    tone: "warning",
    icon: AlertTriangle,
    unread: true,
  },
  {
    id: "savings",
    title: "Yesterday's savings: $3.42",
    body: "MILP scheduler achieved 28.9% cost reduction vs. your baseline routine.",
    time: "8 hours ago",
    tone: "accent",
    icon: TrendingUp,
    unread: false,
  },
  {
    id: "solver",
    title: "Forecast model refreshed",
    body: "LightGBM retrain completed. MAE improved 0.003 kWh/h over the last 30 days.",
    time: "yesterday",
    tone: "muted",
    icon: Sparkles,
    unread: false,
  },
  {
    id: "outage",
    title: "Planned grid maintenance Sunday",
    body: "Your DNO has scheduled a 2h outage 03:00 – 05:00 this Sunday. HEMS will pause overnight runs.",
    time: "2 days ago",
    tone: "warning",
    icon: AlertTriangle,
    unread: false,
  },
];

function NotificationsBody() {
  const [items, setItems] = useState(NOTIFICATIONS_SEED);
  const unread = items.filter((i) => i.unread).length;

  const markAllRead = () =>
    setItems((xs) => xs.map((x) => ({ ...x, unread: false })));

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip tone={unread > 0 ? "accent" : "muted"}>
            {unread} unread
          </Chip>
          <span className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
            {items.length} total
          </span>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0}
          className="rounded-md px-[var(--space-3)] py-[var(--space-2)] font-mono text-[length:var(--fs-10)] font-bold tracking-widest uppercase text-[var(--color-accent-primary)] border border-[var(--color-accent-glow40)] hover:bg-[var(--color-accent-glow10)] transition disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>
      <ul className="flex flex-col gap-[var(--space-3)]">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            onDismiss={() =>
              setItems((xs) => xs.filter((x) => x.id !== item.id))
            }
            onMarkRead={() =>
              setItems((xs) =>
                xs.map((x) => (x.id === item.id ? { ...x, unread: false } : x))
              )
            }
          />
        ))}
        {items.length === 0 && (
          <li className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] p-[var(--space-6)] text-center">
            <div className="label-mono">No notifications</div>
            <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] mt-1">
              You're all caught up.
            </p>
          </li>
        )}
      </ul>
    </div>
  );
}

function NotificationRow({
  item,
  onDismiss,
  onMarkRead,
}: {
  item: NotificationItem;
  onDismiss: () => void;
  onMarkRead: () => void;
}) {
  const Icon = item.icon;
  const toneColor =
    item.tone === "accent"
      ? "var(--color-accent-primary)"
      : item.tone === "warning"
        ? "var(--color-status-warning)"
        : "var(--color-text-muted)";
  return (
    <li
      onClick={onMarkRead}
      className={cn(
        "rounded-md border p-[var(--space-4)] flex items-start gap-[var(--space-4)] transition-colors cursor-pointer",
        item.unread
          ? "bg-[var(--color-accent-glow5)] border-[var(--color-accent-glow40)]"
          : "bg-[var(--color-muted-soft)] border-[var(--color-muted-line)]"
      )}
    >
      <Icon
        size={22}
        strokeWidth={2}
        className="shrink-0 mt-0.5"
        style={{ color: toneColor }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)] leading-tight">
            {item.title}
          </div>
          {item.unread && (
            <span
              className="w-2 h-2 rounded-pill shrink-0 mt-2"
              style={{ background: toneColor, boxShadow: `0 0 6px ${toneColor}` }}
              aria-label="Unread"
            />
          )}
        </div>
        <p className="font-[family-name:var(--ff-body)] text-[length:var(--fs-12)] text-[var(--color-text-secondary)] mt-1 leading-snug">
          {item.body}
        </p>
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)] uppercase tracking-widest">
            {item.time}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] uppercase tracking-widest"
          >
            Dismiss
          </button>
        </div>
      </div>
    </li>
  );
}

// ───────── Help ─────────

function HelpBody() {
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="rounded-md border border-[var(--color-accent-glow40)] bg-[var(--color-accent-glow5)] p-[var(--space-4)] flex items-start gap-[var(--space-4)]">
        <Sparkles
          size={22}
          className="text-[var(--color-accent-primary)] shrink-0 mt-0.5"
          aria-hidden
        />
        <div>
          <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)]">
            Welcome to ENERGY_OPS
          </div>
          <p className="text-[length:var(--fs-12)] text-[var(--color-text-secondary)] mt-1 leading-snug">
            ENERGY_OPS forecasts your household load 24h ahead with LightGBM,
            then schedules deferrable appliances via Google OR-Tools under your
            hard comfort constraints. SHAP explains every decision.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-3)]">
        <div className="label-mono">Keyboard shortcuts</div>
        <div className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] divide-y divide-[var(--color-muted-line)]">
          <Shortcut keys={["Esc"]} label="Close any dialog or popover" />
          <Shortcut keys={["/"]} label="Focus the search bar" />
          <Shortcut keys={["g", "o"]} label="Go to Overview" />
          <Shortcut keys={["g", "f"]} label="Go to Forecast" />
          <Shortcut keys={["g", "s"]} label="Go to Scheduler" />
          <Shortcut keys={["g", "e"]} label="Go to Explain" />
          <Shortcut keys={["g", "r"]} label="Go to Robustness" />
          <Shortcut keys={["R"]} label="Re-plan schedule (on Scheduler page)" />
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-3)]">
        <div className="label-mono">Getting help</div>
        <div className="rounded-md border border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] divide-y divide-[var(--color-muted-line)]">
          <HelpLink icon={MessageCircle} label="Community forum" sub="discuss.energy-ops.local" />
          <HelpLink icon={Mail} label="Email support" sub="support@energy-ops.local" />
          <HelpLink icon={HelpCircle} label="Documentation & API reference" sub="docs.energy-ops.local" />
        </div>
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-[var(--space-4)]">
      <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] text-[var(--color-text-primary)]">
        {label}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {keys.map((k, i) => (
          <span
            key={i}
            className="inline-grid place-items-center min-w-[28px] h-8 px-2 rounded-md border border-[var(--color-accent-glow40)] bg-[var(--color-muted-soft-alt)] text-[var(--color-accent-primary)] font-mono text-[length:var(--fs-12)] font-bold"
          >
            {k === "Command" ? <Command size={12} /> : k === "Keyboard" ? <Keyboard size={12} /> : k}
          </span>
        ))}
      </div>
    </div>
  );
}

function HelpLink({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof Bell;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-[var(--space-4)] p-[var(--space-4)] hover:bg-[var(--color-accent-glow5)] transition-colors text-left"
    >
      <Icon size={20} className="text-[var(--color-accent-primary)] shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)] font-medium text-[var(--color-text-primary)]">
          {label}
        </div>
        <div className="font-mono text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
          {sub}
        </div>
      </div>
    </button>
  );
}

// ───────── Upgrade ─────────

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  current?: boolean;
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Home",
    price: "£0",
    period: "free forever",
    description: "Everything a single household needs to start saving today.",
    features: [
      "24h load forecasting",
      "OR-Tools MILP scheduling",
      "SHAP explanations",
      "Up to 5 appliances",
      "Local-first, no cloud",
    ],
    current: true,
  },
  {
    id: "plus",
    name: "Home Plus",
    price: "£4.99",
    period: "per month",
    description: "Multi-tariff comparison and 30-day historical analytics.",
    features: [
      "Everything in Home",
      "Multi-tariff A/B compare",
      "30-day historical charts",
      "Email + push alerts",
      "Up to 15 appliances",
      "Priority email support",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro Grid",
    price: "£14.99",
    period: "per month",
    description: "For multi-home owners and community energy operators.",
    features: [
      "Everything in Home Plus",
      "Unlimited homes",
      "Multi-home fleet view",
      "Custom tariff uploads",
      "API access · webhooks",
      "Dedicated support",
    ],
  },
];

function UpgradeBody({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState("plus");
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    const plan = PLANS.find((p) => p.id === selected)!;
    return (
      <div className="flex flex-col items-center text-center gap-[var(--space-4)] py-[var(--space-6)]">
        <div className="grid place-items-center w-20 h-20 rounded-full bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)]">
          <Check size={36} strokeWidth={2.5} aria-hidden />
        </div>
        <h3 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-24)] font-bold text-[var(--color-text-primary)]">
          Request received
        </h3>
        <p className="text-[length:var(--fs-14)] text-[var(--color-text-secondary)] max-w-md">
          Your request to upgrade to the <strong>{plan.name}</strong> plan has
          been logged. A human will reach out by email within 24 hours to
          confirm billing and enable the new features.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-[var(--space-4)] rounded-md px-[var(--space-6)] py-[var(--space-3)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="grid grid-cols-3 gap-[var(--space-4)]">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selected === plan.id}
            onSelect={() => setSelected(plan.id)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 pt-[var(--space-4)] border-t border-[var(--color-muted-line)]">
        <div className="text-[length:var(--fs-12)] text-[var(--color-text-muted)]">
          Billed monthly, cancel anytime. Prices include VAT.
        </div>
        <button
          type="button"
          onClick={() => setConfirmed(true)}
          disabled={selected === "basic"}
          className="rounded-md px-[var(--space-6)] py-[var(--space-3)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CreditCard size={16} strokeWidth={2.5} aria-hidden />
          {selected === "basic" ? "Current plan" : "Confirm upgrade"}
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-md border p-[var(--space-4)] text-left transition-all flex flex-col gap-[var(--space-3)]",
        selected
          ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-glow10)] shadow-accent-glow"
          : "border-[var(--color-muted-line)] bg-[var(--color-muted-soft)] hover:border-[var(--color-accent-glow40)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-[family-name:var(--ff-display)] text-[length:var(--fs-18)] font-bold text-[var(--color-text-primary)]">
          {plan.name}
        </div>
        {plan.current && <Chip tone="muted">Current</Chip>}
        {plan.highlighted && !plan.current && <Chip tone="accent">Popular</Chip>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold text-[length:var(--fs-24)] text-[var(--color-text-primary)] tabular-nums">
          {plan.price}
        </span>
        <span className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)] uppercase tracking-widest">
          {plan.period}
        </span>
      </div>
      <p className="text-[length:var(--fs-12)] text-[var(--color-text-muted)] leading-snug">
        {plan.description}
      </p>
      <ul className="flex flex-col gap-1.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[length:var(--fs-12)] text-[var(--color-text-secondary)]"
          >
            <Check
              size={14}
              className="text-[var(--color-accent-primary)] shrink-0 mt-0.5"
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

// ───────── Sign out ─────────

function SignOutBody({
  onConfirm,
  onClose,
  user,
}: {
  onConfirm: () => void;
  onClose: () => void;
  user: Props["user"];
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <p className="text-[length:var(--fs-14)] text-[var(--color-text-secondary)] leading-snug">
        You're about to sign out of{" "}
        <span className="font-mono text-[var(--color-accent-primary)]">
          @{user.username}
        </span>
        . Your schedules, forecasts and notifications will be locked until you
        sign back in.
      </p>
      <div className="flex items-center justify-end gap-[var(--space-3)] mt-[var(--space-2)]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-muted-soft)] border border-[var(--color-muted-line)] text-[var(--color-text-primary)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:bg-[var(--color-muted-soft-alt)] transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2"
        >
          <LogOut size={14} strokeWidth={2.5} aria-hidden />
          Sign Out
        </button>
      </div>
    </div>
  );
}
