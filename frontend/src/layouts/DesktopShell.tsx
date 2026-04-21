import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  CalendarClock,
  Lightbulb,
  ShieldCheck,
  Search,
  Bell,
  HelpCircle,
  Zap,
  Power,
  ChevronUp,
  LogOut,
  Settings,
  UserCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveFeedView } from "./LiveFeedView";
import { HistoricalView } from "./HistoricalView";
import { AppModal, type ModalId } from "./AppModal";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { to: "/",            label: "Overview",    icon: LayoutDashboard },
  { to: "/forecast",    label: "Forecast",    icon: LineChart },
  { to: "/scheduler",   label: "Scheduler",   icon: CalendarClock },
  { to: "/explain",     label: "Explain",     icon: Lightbulb },
  { to: "/robustness",  label: "Robustness",  icon: ShieldCheck },
];

const PAGE_TITLES: Record<string, string> = {
  "/":            "NEURAL_GRID",
  "/forecast":    "FORECAST_ENGINE",
  "/scheduler":   "SCHEDULE_CORE",
  "/explain":     "INFERENCE_TRACE",
  "/robustness":  "RESILIENCE_MONITOR",
  "/style":       "STYLE_GUIDE",
};

type TopTabId = "system-health" | "live-feed" | "historical";

const USER = {
  username: "rohanohiduzzaman",
  displayName: "Rohan Ohiduzzaman",
  role: "System Administrator",
  email: "rohanohiduzzaman@energy-ops.local",
  initials: "RO",
};

export function DesktopShell() {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "HEMS";
  const [activeTab, setActiveTab] = useState<TopTabId>("system-health");
  const [shutdownActive, setShutdownActive] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [modal, setModal] = useState<ModalId>(null);

  const handleSignOut = () => {
    setModal(null);
    setSignedOut(true);
  };

  return (
    <div className="flex min-h-screen h-screen w-full bg-[var(--color-background-base)] text-[var(--color-text-primary)]">
      <Sidebar
        onShutdown={() => setShutdownActive(true)}
        onOpenModal={setModal}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          pageTitle={pageTitle}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenModal={setModal}
        />
        <main className="flex-1 px-[var(--space-8)] py-[var(--space-6)] overflow-y-auto min-h-0">
          <div className="h-full min-h-full flex flex-col">
            {activeTab === "system-health" && <Outlet />}
            {activeTab === "live-feed" && <LiveFeedView />}
            {activeTab === "historical" && <HistoricalView />}
          </div>
        </main>
      </div>

      <AppModal
        id={modal}
        onClose={() => setModal(null)}
        onSignOut={handleSignOut}
        user={USER}
      />

      {shutdownActive && (
        <ShutdownOverlay onReactivate={() => setShutdownActive(false)} />
      )}

      {signedOut && (
        <SignedOutOverlay
          user={USER}
          onSignIn={() => setSignedOut(false)}
        />
      )}
    </div>
  );
}

// ───────── Sidebar ─────────

function Sidebar({
  onShutdown,
  onOpenModal,
}: {
  onShutdown: () => void;
  onOpenModal: (id: ModalId) => void;
}) {
  const [confirmShutdown, setConfirmShutdown] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const requestShutdown = () => setConfirmShutdown(true);
  const confirm = () => {
    setConfirmShutdown(false);
    onShutdown();
  };

  const openFromProfile = (id: ModalId) => {
    setProfileOpen(false);
    onOpenModal(id);
  };

  return (
    <aside className="flex flex-col w-[var(--shell-sidebar-width)] shrink-0 border-r border-[var(--color-muted-line)] bg-[var(--color-background-glass)] backdrop-blur-md">
      {/* brand */}
      <div className="px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-8)] flex items-center gap-3">
        <div className="grid place-items-center w-12 h-12 rounded-md bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)]">
          <Zap
            className="text-[var(--color-accent-primary)]"
            size={24}
            strokeWidth={2.5}
          />
        </div>
        <div className="font-mono font-bold text-[length:var(--fs-20)] text-[var(--color-accent-primary)] tracking-widest">
          ENERGY_OPS
        </div>
      </div>

      {/* nav */}
      <nav className="px-[var(--space-3)] flex-1 flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-[var(--space-4)] py-[var(--space-3)] rounded-md transition-colors",
                "text-[var(--color-text-secondary)]",
                "hover:bg-[var(--color-accent-glow5)] hover:text-[var(--color-text-primary)]",
                isActive &&
                  "bg-[var(--color-accent-glow20)] text-[var(--color-accent-primary)] border border-[var(--color-accent-glow40)]"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden
                />
                <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-16)] font-medium">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* footer: emergency button + clickable profile */}
      <div className="p-[var(--space-4)] flex flex-col gap-[var(--space-3)] border-t border-[var(--color-muted-line)]">
        <button
          type="button"
          onClick={requestShutdown}
          className="flex items-center justify-center gap-2 rounded-md py-[var(--space-3)] bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition"
        >
          <Power size={16} strokeWidth={2.5} aria-hidden />
          Emergency Shutdown
        </button>

        <ProfileSection
          open={profileOpen}
          setOpen={setProfileOpen}
          onOpenModal={openFromProfile}
        />
      </div>

      {confirmShutdown && (
        <ShutdownConfirm
          onConfirm={confirm}
          onCancel={() => setConfirmShutdown(false)}
        />
      )}
    </aside>
  );
}

// ───────── Profile section + popover ─────────

function ProfileSection({
  open,
  setOpen,
  onOpenModal,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onOpenModal: (id: ModalId) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left",
          "hover:bg-[var(--color-accent-glow5)]",
          open && "bg-[var(--color-accent-glow10)]"
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="grid place-items-center w-11 h-11 rounded-full bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono font-bold text-[length:var(--fs-14)] shrink-0">
          {USER.initials}
        </div>
        <div className="flex flex-col leading-tight min-w-0 flex-1">
          <div className="font-mono text-[length:var(--fs-14)] text-[var(--color-text-primary)] font-medium truncate">
            {USER.username}
          </div>
          <div className="label-mono text-[length:var(--fs-10)] truncate">
            {USER.role}
          </div>
        </div>
        <ChevronUp
          size={16}
          strokeWidth={2}
          className={cn(
            "text-[var(--color-text-muted)] transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-0 w-[340px] rounded-md border border-[var(--color-accent-glow40)] bg-[var(--color-background-elevated)] backdrop-blur-md shadow-accent-glow overflow-hidden z-50"
        >
          <div className="p-[var(--space-4)] border-b border-[var(--color-muted-line)] flex items-start gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-full bg-[var(--color-accent-glow20)] border border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono font-bold text-[length:var(--fs-16)] shrink-0">
              {USER.initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-[family-name:var(--ff-display)] text-[length:var(--fs-18)] font-bold text-[var(--color-text-primary)] leading-tight">
                {USER.displayName}
              </div>
              <div className="font-mono text-[length:var(--fs-12)] text-[var(--color-accent-primary)] mt-1">
                @{USER.username}
              </div>
              <div className="font-mono text-[length:var(--fs-10)] text-[var(--color-text-muted)] mt-1 break-all">
                {USER.email}
              </div>
            </div>
          </div>
          <ul className="flex flex-col py-2">
            <ProfileItem
              icon={UserCircle2}
              label="View profile"
              onClick={() => onOpenModal("profile")}
            />
            <ProfileItem
              icon={Settings}
              label="Account settings"
              onClick={() => onOpenModal("settings")}
            />
            <ProfileItem
              icon={Bell}
              label="Notifications"
              onClick={() => onOpenModal("notifications")}
            />
          </ul>
          <div className="border-t border-[var(--color-muted-line)] py-2">
            <ProfileItem
              icon={LogOut}
              label="Sign out"
              tone="danger"
              onClick={() => onOpenModal("signout")}
            />
          </div>
          <div className="px-[var(--space-4)] py-[var(--space-3)] border-t border-[var(--color-muted-line)] bg-[var(--color-muted-soft)]">
            <div className="flex items-center justify-between">
              <span className="label-mono text-[length:var(--fs-9)]">Status</span>
              <span className="flex items-center gap-1.5 font-mono text-[length:var(--fs-9)] text-[var(--color-accent-primary)] uppercase tracking-widest">
                <span className="inline-block w-1.5 h-1.5 rounded-pill bg-[var(--color-accent-primary)] animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors",
          tone === "danger"
            ? "text-[var(--color-status-danger-fg)] hover:bg-[var(--color-status-danger)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-glow5)] hover:text-[var(--color-text-primary)]"
        )}
      >
        <Icon size={18} strokeWidth={2} aria-hidden />
        <span className="font-[family-name:var(--ff-body)] text-[length:var(--fs-14)]">
          {label}
        </span>
      </button>
    </li>
  );
}

// ───────── Emergency shutdown confirm + overlay ─────────

function ShutdownConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[var(--color-background-overlay)] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shutdown-title"
    >
      <div className="w-[min(480px,90vw)] rounded-md border border-[var(--color-status-danger)] bg-[var(--color-background-elevated)] p-[var(--space-6)] flex flex-col gap-[var(--space-4)] shadow-accent-glow">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-12 h-12 rounded-pill bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)]">
            <AlertTriangle size={22} strokeWidth={2.5} aria-hidden />
          </div>
          <h2
            id="shutdown-title"
            className="font-[family-name:var(--ff-display)] text-[length:var(--fs-20)] font-bold text-[var(--color-text-primary)]"
          >
            Confirm Emergency Shutdown
          </h2>
        </div>
        <p className="text-[length:var(--fs-14)] text-[var(--color-text-secondary)] leading-snug">
          This will halt all scheduled appliance runs, cut power to deferrable
          loads, and place the dashboard into a locked state. This action is
          immediate.
        </p>
        <div className="flex items-center justify-end gap-[var(--space-3)] mt-[var(--space-2)]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-muted-soft)] border border-[var(--color-muted-line)] text-[var(--color-text-primary)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:bg-[var(--color-muted-soft-alt)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-status-danger)] text-[var(--color-status-danger-fg)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2"
          >
            <Power size={14} strokeWidth={2.5} aria-hidden />
            Shut Down
          </button>
        </div>
      </div>
    </div>
  );
}

function ShutdownOverlay({ onReactivate }: { onReactivate: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/85 backdrop-blur-md"
      role="alertdialog"
      aria-labelledby="shutdown-overlay-title"
    >
      <div className="flex flex-col items-center gap-[var(--space-6)] text-center max-w-[520px] px-[var(--space-6)]">
        <div className="grid place-items-center w-28 h-28 rounded-full border-2 border-[var(--color-status-danger)] bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)]">
          <Power size={48} strokeWidth={2.5} aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <div className="label-mono text-[var(--color-status-danger)]">
            ENERGY_OPS · STATE
          </div>
          <h2
            id="shutdown-overlay-title"
            className="font-[family-name:var(--ff-display)] text-[length:var(--fs-36)] font-bold text-[var(--color-text-primary)] tracking-tight"
          >
            System Shut Down
          </h2>
          <p className="text-[length:var(--fs-14)] text-[var(--color-text-muted)] leading-snug">
            All scheduled appliance runs are halted. Forecast and tariff
            services are paused. Reactivate to resume normal operation.
          </p>
        </div>
        <button
          type="button"
          onClick={onReactivate}
          className="rounded-md px-[var(--space-6)] py-[var(--space-4)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-14)] font-bold tracking-widest uppercase hover:brightness-110 transition flex items-center gap-2"
        >
          <RotateCcw size={18} strokeWidth={2.5} aria-hidden />
          Reactivate System
        </button>
      </div>
    </div>
  );
}

function SignedOutOverlay({
  user,
  onSignIn,
}: {
  user: typeof USER;
  onSignIn: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/85 backdrop-blur-md"
      role="alertdialog"
    >
      <div className="flex flex-col items-center gap-[var(--space-6)] text-center max-w-[520px] px-[var(--space-6)]">
        <div className="grid place-items-center w-24 h-24 rounded-full bg-[var(--color-accent-glow20)] border-2 border-[var(--color-accent-glow40)] text-[var(--color-accent-primary)] font-mono font-bold text-[length:var(--fs-36)]">
          {user.initials}
        </div>
        <div className="flex flex-col gap-2">
          <div className="label-mono">You've been signed out</div>
          <h2 className="font-[family-name:var(--ff-display)] text-[length:var(--fs-30)] font-bold text-[var(--color-text-primary)] tracking-tight">
            {user.displayName}
          </h2>
          <p className="text-[length:var(--fs-14)] text-[var(--color-text-muted)] leading-snug">
            Your session has ended. Sign back in to resume forecasting,
            scheduling and notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-md px-[var(--space-6)] py-[var(--space-4)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-14)] font-bold tracking-widest uppercase hover:brightness-110 transition"
        >
          Sign back in
        </button>
      </div>
    </div>
  );
}

// ───────── Top bar ─────────

function TopBar({
  pageTitle,
  activeTab,
  onTabChange,
  onOpenModal,
}: {
  pageTitle: string;
  activeTab: TopTabId;
  onTabChange: (tab: TopTabId) => void;
  onOpenModal: (id: ModalId) => void;
}) {
  return (
    <header className="h-[80px] shrink-0 flex items-center gap-[var(--space-6)] px-[var(--space-8)] border-b border-[var(--color-muted-line)] bg-[var(--color-background-glass)] backdrop-blur-md">
      <div className="font-mono font-bold text-[length:var(--fs-20)] text-[var(--color-accent-primary)] tracking-widest">
        {pageTitle}
      </div>

      <div className="flex-1 max-w-[460px] relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          placeholder="QUERY SYSTEM..."
          className="w-full rounded-md bg-[var(--color-muted-soft)] border border-[var(--color-muted-line)] pl-11 pr-3 py-3 font-mono text-[length:var(--fs-14)] tracking-widest uppercase placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] outline-none"
        />
      </div>

      <nav className="flex items-center gap-[var(--space-6)]">
        <TopTab id="system-health" label="System Health" activeTab={activeTab} onClick={onTabChange} />
        <TopTab id="live-feed"     label="Live Feed"     activeTab={activeTab} onClick={onTabChange} />
        <TopTab id="historical"    label="Historical"    activeTab={activeTab} onClick={onTabChange} />
      </nav>

      <div className="flex items-center gap-[var(--space-4)] ml-auto">
        <IconBtn
          onClick={() => onOpenModal("notifications")}
          label="Notifications"
        >
          <Bell size={20} aria-hidden />
          <span
            className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] rounded-pill bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono font-bold text-[10px] px-1"
            aria-label="3 unread"
          >
            3
          </span>
        </IconBtn>
        <IconBtn onClick={() => onOpenModal("help")} label="Help and shortcuts">
          <HelpCircle size={20} aria-hidden />
        </IconBtn>
        <button
          type="button"
          onClick={() => onOpenModal("upgrade")}
          className="rounded-md px-[var(--space-4)] py-[var(--space-3)] bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] font-mono text-[length:var(--fs-12)] font-bold tracking-widest uppercase hover:brightness-110 transition"
        >
          Upgrade Capacity
        </button>
      </div>
    </header>
  );
}

function TopTab({
  id,
  label,
  activeTab,
  onClick,
}: {
  id: TopTabId;
  label: string;
  activeTab: TopTabId;
  onClick: (id: TopTabId) => void;
}) {
  const active = id === activeTab;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "font-mono text-[length:var(--fs-12)] tracking-widest uppercase transition-colors pb-1",
        active
          ? "text-[var(--color-accent-primary)] border-b-2 border-[var(--color-accent-primary)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {label}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid place-items-center w-11 h-11 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-glow5)] transition-colors"
    >
      {children}
    </button>
  );
}
