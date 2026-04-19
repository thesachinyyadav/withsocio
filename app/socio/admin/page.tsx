"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OverviewPayload = {
  generatedAt: string;
  accounts: {
    totalExpenses: number;
    totalAmount: number;
    pendingApprovalCount: number;
    purchasedCount: number;
    settledCount: number;
    pendingApprovalAmount: number;
    purchasedAmount: number;
    settledAmount: number;
    pendingClearanceAmount: number;
  };
  careers: {
    totalApplicants: number;
    applicantsToday: number;
    campusCount: number;
    christidApplicants: number;
    statuses: {
      pending: number;
      reviewed: number;
      shortlisted: number;
      hired: number;
      alumni: number;
      rejected: number;
    };
  };
  interns: {
    totalWorkLogs: number;
    workLogsToday: number;
    totalReports: number;
    reportsToday: number;
    logStatuses: {
      submitted: number;
      in_progress: number;
      completed: number;
      blocked: number;
      reviewed: number;
    };
    reportStatuses: {
      open: number;
      in_progress: number;
      resolved: number;
      closed: number;
    };
    reportPriorities: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  mailbox: {
    receivedNotifications: number;
    trackedEmails: number;
    readEmails: number;
    unreadEmails: number;
    starredEmails: number;
    lastNotificationAt: string | null;
  };
};

type ToneKey = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";

type ChartDatum = {
  label: string;
  value: number;
  tone: ToneKey;
};

type QuickLinkModule =
  | "accounts"
  | "mailbox"
  | "panel"
  | "internLogin"
  | "internDashboard"
  | "internWorkspace"
  | "careers"
  | "about";

type QuickLink = {
  title: string;
  description: string;
  href: string;
  module: QuickLinkModule;
};

const HUB_SESSION_KEY = "socio_admin_hub_token";
const MASTER_ADMIN_SESSION_KEY = "socio_master_admin_token";
const PANEL_SESSION_KEY = "socio_panel_admin_token";
const MAILBOX_SESSION_KEY = "socio_mailbox_admin_token";
const PANEL_BYPASS_ONCE_KEY = "socio_panel_bypass_once";
const MAILBOX_BYPASS_ONCE_KEY = "socio_mailbox_bypass_once";
const INTERNS_ADMIN_BYPASS_ONCE_KEY = "socio_interns_admin_bypass_once";

const quickLinks: QuickLink[] = [
  {
    title: "SOCIO Accounts",
    description: "Approvals, purchases, settlement tracking",
    href: "/socio/accounts",
    module: "accounts",
  },
  {
    title: "SOCIO Mail",
    description: "Inbox, sent emails, compose and state",
    href: "/mail",
    module: "mailbox",
  },
  {
    title: "Intern Admin Panel",
    description: "Applicant review and lifecycle actions",
    href: "/socio/panel",
    module: "panel",
  },
  {
    title: "Intern Login",
    description: "Intern/authentication entry point",
    href: "/socio/interns/login",
    module: "internLogin",
  },
  {
    title: "Intern Dashboard",
    description: "Admin-side intern operations dashboard",
    href: "/socio/interns/dashboard",
    module: "internDashboard",
  },
  {
    title: "Intern Workspace",
    description: "Intern work logs/reports workspace",
    href: "/socio/interns/workspace",
    module: "internWorkspace",
  },
  {
    title: "Careers (christid)",
    description: "Internship application form and flow",
    href: "/socio/careers/christid",
    module: "careers",
  },
  {
    title: "About SOCIO Roles",
    description: "Role descriptions and intern tracks",
    href: "/socio/careers/christid/about-socio",
    module: "about",
  },
];

const toneStyles: Record<
  ToneKey,
  {
    bar: string;
    soft: string;
    text: string;
    ring: string;
    solid: string;
  }
> = {
  blue: {
    bar: "bg-blue-500",
    soft: "bg-blue-50",
    text: "text-blue-800",
    ring: "border-blue-200",
    solid: "#154CB3",
  },
  emerald: {
    bar: "bg-emerald-500",
    soft: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "border-emerald-200",
    solid: "#059669",
  },
  amber: {
    bar: "bg-amber-500",
    soft: "bg-amber-50",
    text: "text-amber-800",
    ring: "border-amber-200",
    solid: "#d97706",
  },
  rose: {
    bar: "bg-rose-500",
    soft: "bg-rose-50",
    text: "text-rose-800",
    ring: "border-rose-200",
    solid: "#e11d48",
  },
  violet: {
    bar: "bg-violet-500",
    soft: "bg-violet-50",
    text: "text-violet-800",
    ring: "border-violet-200",
    solid: "#7c3aed",
  },
  slate: {
    bar: "bg-slate-500",
    soft: "bg-slate-100",
    text: "text-slate-700",
    ring: "border-slate-300",
    solid: "#475569",
  },
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatCount = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

function MiniBarChart({ title, data }: { title: string; data: ChartDatum[] }) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const max = Math.max(1, ...data.map((entry) => entry.value));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <span className="text-xs font-semibold text-slate-500">Total {formatCount(total)}</span>
      </div>
      <div className="mt-4 space-y-3">
        {data.map((entry) => (
          <div key={entry.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${toneStyles[entry.tone].bar}`} />
                {entry.label}
              </span>
              <span className="font-semibold text-slate-800">
                {formatCount(entry.value)}
                {total > 0 ? ` (${Math.round((entry.value / total) * 100)}%)` : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${toneStyles[entry.tone].bar}`}
                style={{ width: `${Math.max(6, (entry.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DistributionCard({
  title,
  subtitle,
  centerLabel,
  segments,
  formatter,
}: {
  title: string;
  subtitle: string;
  centerLabel: string;
  segments: ChartDatum[];
  formatter: (value: number) => string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo(() => {
    if (total <= 0) return [] as Array<ChartDatum & { dashArray: string; dashOffset: number }>;
    let covered = 0;

    return segments
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const dash = (segment.value / total) * circumference;
        const arc = {
          ...segment,
          dashArray: `${dash} ${circumference - dash}`,
          dashOffset: -covered,
        };
        covered += dash;
        return arc;
      });
  }, [segments, total, circumference]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
        <div className="relative mx-auto h-[130px] w-[130px]">
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
            {arcs.map((segment) => (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={toneStyles[segment.tone].solid}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                transform="rotate(-90 60 60)"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{centerLabel}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{formatter(total)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {segments.map((segment) => {
            const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
            return (
              <div key={segment.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${toneStyles[segment.tone].bar}`} />
                    {segment.label}
                  </p>
                  <p className="text-xs font-bold text-slate-700">{formatter(segment.value)}</p>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div
                    className={`h-1.5 rounded-full ${toneStyles[segment.tone].bar}`}
                    style={{ width: `${Math.max(4, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ModuleRail({ title, segments }: { title: string; segments: ChartDatum[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
      <div className="mt-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className="flex h-4 w-full">
          {segments.map((segment) => {
            const width = total > 0 ? Math.max(4, (segment.value / total) * 100) : 0;
            return (
              <div
                key={segment.label}
                className={`${toneStyles[segment.tone].bar}`}
                style={{ width: `${width}%` }}
                title={`${segment.label}: ${formatCount(segment.value)}`}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${toneStyles[segment.tone].bar}`} />
              {segment.label}
            </span>
            <span className="text-xs font-bold text-slate-700">{formatCount(segment.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SocioAdminHubPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);

  const accountsChart = useMemo<ChartDatum[]>(
    () => [
      {
        label: "Pending Approval",
        value: overview?.accounts.pendingApprovalCount || 0,
        tone: "amber",
      },
      {
        label: "Purchased",
        value: overview?.accounts.purchasedCount || 0,
        tone: "blue",
      },
      {
        label: "Settled",
        value: overview?.accounts.settledCount || 0,
        tone: "emerald",
      },
    ],
    [overview]
  );

  const careersChart = useMemo<ChartDatum[]>(
    () => [
      { label: "Pending", value: overview?.careers.statuses.pending || 0, tone: "blue" },
      { label: "Reviewed", value: overview?.careers.statuses.reviewed || 0, tone: "slate" },
      {
        label: "Shortlisted",
        value: overview?.careers.statuses.shortlisted || 0,
        tone: "emerald",
      },
      { label: "Hired", value: overview?.careers.statuses.hired || 0, tone: "violet" },
      { label: "Alumni", value: overview?.careers.statuses.alumni || 0, tone: "amber" },
      { label: "Rejected", value: overview?.careers.statuses.rejected || 0, tone: "rose" },
    ],
    [overview]
  );

  const internLogsChart = useMemo<ChartDatum[]>(
    () => [
      {
        label: "Submitted",
        value: overview?.interns.logStatuses.submitted || 0,
        tone: "blue",
      },
      {
        label: "In Progress",
        value: overview?.interns.logStatuses.in_progress || 0,
        tone: "amber",
      },
      {
        label: "Completed",
        value: overview?.interns.logStatuses.completed || 0,
        tone: "emerald",
      },
      {
        label: "Blocked",
        value: overview?.interns.logStatuses.blocked || 0,
        tone: "rose",
      },
      {
        label: "Reviewed",
        value: overview?.interns.logStatuses.reviewed || 0,
        tone: "violet",
      },
    ],
    [overview]
  );

  const reportsChart = useMemo<ChartDatum[]>(
    () => [
      { label: "Open", value: overview?.interns.reportStatuses.open || 0, tone: "rose" },
      {
        label: "In Progress",
        value: overview?.interns.reportStatuses.in_progress || 0,
        tone: "amber",
      },
      {
        label: "Resolved",
        value: overview?.interns.reportStatuses.resolved || 0,
        tone: "emerald",
      },
      { label: "Closed", value: overview?.interns.reportStatuses.closed || 0, tone: "slate" },
    ],
    [overview]
  );

  const mailboxChart = useMemo<ChartDatum[]>(
    () => [
      { label: "Read", value: overview?.mailbox.readEmails || 0, tone: "emerald" },
      { label: "Unread", value: overview?.mailbox.unreadEmails || 0, tone: "blue" },
      { label: "Starred", value: overview?.mailbox.starredEmails || 0, tone: "amber" },
    ],
    [overview]
  );

  const accountsAmountChart = useMemo<ChartDatum[]>(
    () => [
      {
        label: "Pending Amount",
        value: overview?.accounts.pendingApprovalAmount || 0,
        tone: "amber",
      },
      {
        label: "Purchased Amount",
        value: overview?.accounts.purchasedAmount || 0,
        tone: "blue",
      },
      {
        label: "Settled Amount",
        value: overview?.accounts.settledAmount || 0,
        tone: "emerald",
      },
    ],
    [overview]
  );

  const moduleFootprint = useMemo<ChartDatum[]>(
    () => [
      { label: "Accounts Entries", value: overview?.accounts.totalExpenses || 0, tone: "blue" },
      { label: "Career Applicants", value: overview?.careers.totalApplicants || 0, tone: "violet" },
      { label: "Work Logs", value: overview?.interns.totalWorkLogs || 0, tone: "emerald" },
      { label: "Reports", value: overview?.interns.totalReports || 0, tone: "amber" },
      {
        label: "Mailbox Notifications",
        value: overview?.mailbox.receivedNotifications || 0,
        tone: "slate",
      },
    ],
    [overview]
  );

  const hubHealthScore = useMemo(() => {
    if (!overview) return 0;

    const backlog =
      overview.accounts.pendingApprovalCount +
      overview.interns.reportStatuses.open +
      overview.interns.reportStatuses.in_progress +
      overview.mailbox.unreadEmails;

    const throughput =
      overview.accounts.settledCount +
      overview.interns.reportStatuses.resolved +
      overview.interns.reportStatuses.closed +
      overview.mailbox.readEmails;

    const score = Math.round((throughput / Math.max(1, throughput + backlog)) * 100);
    return Math.max(0, Math.min(100, score));
  }, [overview]);

  const hubHealthLabel =
    hubHealthScore >= 80
      ? "Strong"
      : hubHealthScore >= 60
        ? "Stable"
        : hubHealthScore >= 40
          ? "Watch"
          : "Critical";

  const quickLinkPulse = useMemo<Record<QuickLinkModule, string>>(
    () => ({
      accounts: `${formatCount(overview?.accounts.pendingApprovalCount || 0)} pending approvals`,
      mailbox: `${formatCount(overview?.mailbox.unreadEmails || 0)} unread`,
      panel: `${formatCount(overview?.careers.totalApplicants || 0)} applicants`,
      internLogin: "Entry gateway",
      internDashboard: `${formatCount(overview?.interns.totalWorkLogs || 0)} logs tracked`,
      internWorkspace: `${formatCount(overview?.interns.workLogsToday || 0)} logs today`,
      careers: `${formatCount(overview?.careers.christidApplicants || 0)} christid applicants`,
      about: "Role guide",
    }),
    [overview]
  );

  const primeRedirectSession = (module: QuickLinkModule) => {
    if (!token || typeof window === "undefined") return;

    window.sessionStorage.setItem(MASTER_ADMIN_SESSION_KEY, token);

    if (module === "panel") {
      window.sessionStorage.setItem(PANEL_BYPASS_ONCE_KEY, "1");
      return;
    }

    if (module === "mailbox") {
      window.sessionStorage.setItem(MAILBOX_BYPASS_ONCE_KEY, "1");
      return;
    }

    if (module === "internDashboard") {
      window.sessionStorage.setItem(INTERNS_ADMIN_BYPASS_ONCE_KEY, "1");
    }
  };

  const fetchOverview = async (adminToken: string) => {
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await fetch("/api/admin/overview", {
        headers: {
          "x-admin-password": adminToken,
        },
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as OverviewPayload & {
        error?: string;
      };

      if (response.status === 401) {
        throw new Error("Invalid admin password.");
      }

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load overview.");
      }

      setOverview(payload);
      setToken(adminToken);
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(HUB_SESSION_KEY, adminToken);
        window.sessionStorage.setItem(MASTER_ADMIN_SESSION_KEY, adminToken);
      }
    } catch (error) {
      setOverview(null);
      setToken("");
      setIsAuthenticated(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(HUB_SESSION_KEY);
        window.sessionStorage.removeItem(MASTER_ADMIN_SESSION_KEY);
      }
      setAuthError(error instanceof Error ? error.message : "Could not load admin overview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(HUB_SESSION_KEY) || "";
    if (!saved) return;
    setPasswordInput(saved);
    void fetchOverview(saved);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const candidate = passwordInput.trim();
    if (!candidate) {
      setAuthError("Enter admin password.");
      return;
    }
    await fetchOverview(candidate);
  };

  const handleLogout = () => {
    setOverview(null);
    setToken("");
    setPasswordInput("");
    setIsAuthenticated(false);
    setAuthError("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(HUB_SESSION_KEY);
      window.sessionStorage.removeItem(MASTER_ADMIN_SESSION_KEY);
      window.sessionStorage.removeItem(PANEL_SESSION_KEY);
      window.sessionStorage.removeItem(MAILBOX_SESSION_KEY);
      window.sessionStorage.removeItem(PANEL_BYPASS_ONCE_KEY);
      window.sessionStorage.removeItem(MAILBOX_BYPASS_ONCE_KEY);
      window.sessionStorage.removeItem(INTERNS_ADMIN_BYPASS_ONCE_KEY);
      window.localStorage.removeItem("interns_token");
      window.localStorage.removeItem("interns_role");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,_#bfdbfe_0%,_#eff6ff_35%,_#f8fafc_70%)] px-4 py-10">
        <div className="pointer-events-none absolute -left-20 top-20 h-56 w-56 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-12 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-md rounded-2xl border border-blue-100 bg-white/95 p-7 shadow-[0_24px_70px_-35px_rgba(21,76,179,0.55)]">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/socio.svg" alt="SOCIO" width={120} height={32} />
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ADMIN HUB
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Master Admin</h1>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600/20 transition focus:ring-4"
            />
            {authError ? <p className="text-sm font-semibold text-rose-600">{authError}</p> : null}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#154CB3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#103f93] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Opening..." : "Open Admin Hub"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
            <Link href="/socio/panel" className="font-semibold text-[#154CB3] hover:underline">
              Panel
            </Link>
            <Link href="/socio/accounts" className="font-semibold text-[#154CB3] hover:underline">
              Accounts
            </Link>
            <Link href="/mail" className="font-semibold text-[#154CB3] hover:underline">
              Mailbox
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_55%,_#eef2ff_100%)] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[22rem] h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_24px_70px_-35px_rgba(21,76,179,0.6)]">
          <div className="bg-[linear-gradient(120deg,_rgba(21,76,179,0.08)_0%,_rgba(59,130,246,0.07)_45%,_rgba(255,255,255,0.9)_100%)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/socio.svg" alt="SOCIO" width={120} height={32} />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Master Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchOverview(token)}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Last sync: {overview?.generatedAt ? new Date(overview.generatedAt).toLocaleString("en-IN") : "-"}
          </p>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Accounts Spend</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {formatINR(overview?.accounts.totalAmount || 0)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatCount(overview?.accounts.totalExpenses || 0)} entries</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-amber-700">Pending Clearance</p>
                <p className="mt-1 text-2xl font-black text-amber-900">
                  {formatINR(overview?.accounts.pendingClearanceAmount || 0)}
                </p>
                <p className="mt-1 text-xs text-amber-700">Pending + Purchased</p>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-indigo-700">Career Applicants</p>
                <p className="mt-1 text-2xl font-black text-indigo-900">
                  {formatCount(overview?.careers.totalApplicants || 0)}
                </p>
                <p className="mt-1 text-xs text-indigo-700">
                  Today {formatCount(overview?.careers.applicantsToday || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Intern Ops</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">
                  {formatCount((overview?.interns.totalWorkLogs || 0) + (overview?.interns.totalReports || 0))}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Logs {formatCount(overview?.interns.totalWorkLogs || 0)} • Reports {formatCount(overview?.interns.totalReports || 0)}
                </p>
              </div>
            </div>

            <ModuleRail title="SOCIO Module Footprint" segments={moduleFootprint} />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hub Health</p>
            <div className="mt-4 flex flex-col items-center gap-4">
              <div
                className="relative h-32 w-32 rounded-full"
                style={{
                  background: `conic-gradient(#154CB3 ${hubHealthScore}%, #dbeafe ${hubHealthScore}% 100%)`,
                }}
              >
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                  <p className="text-2xl font-black text-slate-900">{hubHealthScore}%</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{hubHealthLabel}</p>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-600">Unread Mail</span>
                  <span className="font-bold text-slate-800">{formatCount(overview?.mailbox.unreadEmails || 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-600">Open Reports</span>
                  <span className="font-bold text-slate-800">
                    {formatCount(overview?.interns.reportStatuses.open || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-600">Pending Approvals</span>
                  <span className="font-bold text-slate-800">
                    {formatCount(overview?.accounts.pendingApprovalCount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Navigation Center</h2>
            <span className="text-xs text-slate-500">All SOCIO modules in one place</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => primeRedirectSession(link.module)}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#154CB3]/50 hover:bg-white hover:shadow-sm"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-100/70 blur-2xl transition group-hover:bg-blue-200/80" />
                <p className="relative text-sm font-bold text-slate-900 group-hover:text-[#154CB3]">{link.title}</p>
                <p className="mt-1 text-xs text-slate-600">{link.description}</p>
                <p className="mt-3 text-[11px] font-semibold text-slate-500">{quickLinkPulse[link.module]}</p>
                <p className="mt-2 text-[11px] font-semibold text-[#154CB3]">Open module</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <DistributionCard
            title="Accounts Cashflow"
            subtitle="Amount split by stage"
            centerLabel="Total"
            segments={accountsAmountChart}
            formatter={formatINR}
          />
          <DistributionCard
            title="Careers Lifecycle"
            subtitle="Application status distribution"
            centerLabel="Applicants"
            segments={careersChart}
            formatter={formatCount}
          />
          <DistributionCard
            title="Mailbox Balance"
            subtitle="Read vs unread load"
            centerLabel="Emails"
            segments={mailboxChart}
            formatter={formatCount}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <MiniBarChart title="Accounts Status Count" data={accountsChart} />
          <MiniBarChart title="Intern Work Log Flow" data={internLogsChart} />
          <MiniBarChart title="Intern Report Status" data={reportsChart} />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Live Pulse Snapshot</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-700">Mailbox Notifications</p>
                <p className="mt-1 text-xl font-black text-blue-900">
                  {formatCount(overview?.mailbox.receivedNotifications || 0)}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Tracked {formatCount(overview?.mailbox.trackedEmails || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-xs uppercase tracking-wide text-indigo-700">Career Campuses</p>
                <p className="mt-1 text-xl font-black text-indigo-900">
                  {formatCount(overview?.careers.campusCount || 0)}
                </p>
                <p className="mt-1 text-xs text-indigo-700">
                  christid {formatCount(overview?.careers.christidApplicants || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Intern Logs Today</p>
                <p className="mt-1 text-xl font-black text-emerald-900">
                  {formatCount(overview?.interns.workLogsToday || 0)}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Total logs {formatCount(overview?.interns.totalWorkLogs || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-700">Intern Reports Today</p>
                <p className="mt-1 text-xl font-black text-amber-900">
                  {formatCount(overview?.interns.reportsToday || 0)}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Last mail event {overview?.mailbox.lastNotificationAt ? "active" : "none"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Mail Notification Time</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {overview?.mailbox.lastNotificationAt
                  ? new Date(overview.mailbox.lastNotificationAt).toLocaleString("en-IN")
                  : "No notifications yet"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
