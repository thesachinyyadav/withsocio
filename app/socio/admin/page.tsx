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

type ChartDatum = {
  label: string;
  value: number;
  tone: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
};

const HUB_SESSION_KEY = "socio_admin_hub_token";

const quickLinks = [
  {
    title: "SOCIO Accounts",
    description: "Approvals, purchases, settlement tracking",
    href: "/socio/accounts",
  },
  {
    title: "SOCIO Mail",
    description: "Inbox, sent emails, compose and state",
    href: "/mail",
  },
  {
    title: "Intern Admin Panel",
    description: "Applicant review and lifecycle actions",
    href: "/socio/panel",
  },
  {
    title: "Intern Login",
    description: "Intern/authentication entry point",
    href: "/socio/interns/login",
  },
  {
    title: "Intern Dashboard",
    description: "Admin-side intern operations dashboard",
    href: "/socio/interns/dashboard",
  },
  {
    title: "Intern Workspace",
    description: "Intern work logs/reports workspace",
    href: "/socio/interns/workspace",
  },
  {
    title: "Careers (christid)",
    description: "Internship application form and flow",
    href: "/socio/careers/christid",
  },
  {
    title: "About SOCIO Roles",
    description: "Role descriptions and intern tracks",
    href: "/socio/careers/christid/about-socio",
  },
];

const toneClasses: Record<ChartDatum["tone"], string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
};

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

function MiniBarChart({ title, data }: { title: string; data: ChartDatum[] }) {
  const max = Math.max(1, ...data.map((entry) => entry.value));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((entry) => (
          <div key={entry.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>{entry.label}</span>
              <span className="font-semibold text-slate-800">{entry.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${toneClasses[entry.tone]}`}
                style={{ width: `${Math.max(6, (entry.value / max) * 100)}%` }}
              />
            </div>
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
      }
    } catch (error) {
      setOverview(null);
      setToken("");
      setIsAuthenticated(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(HUB_SESSION_KEY);
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
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/socio.svg" alt="SOCIO" width={120} height={32} />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              ADMIN HUB
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">SOCIO Control Center</h1>
          <p className="mt-2 text-sm text-slate-600">
            One place for accounts, mailbox, interns, and careers access.
          </p>

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
            <Link href="/mail" className="font-semibold text-[#154CB3] hover:underline">
              Mailbox
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_42%,_#f8fafc_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/socio.svg" alt="SOCIO" width={120} height={32} />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">SOCIO Admin Hub</h1>
                <p className="text-sm text-slate-600">
                  Central control center for all SOCIO modules
                </p>
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
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Accounts Spend</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{formatINR(overview?.accounts.totalAmount || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">{overview?.accounts.totalExpenses || 0} entries</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending Clearance</p>
            <p className="mt-1 text-2xl font-black text-amber-900">
              {formatINR(overview?.accounts.pendingClearanceAmount || 0)}
            </p>
            <p className="mt-1 text-xs text-amber-700">Pending + Purchased</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-indigo-700">Career Applicants</p>
            <p className="mt-1 text-2xl font-black text-indigo-900">{overview?.careers.totalApplicants || 0}</p>
            <p className="mt-1 text-xs text-indigo-700">
              Today: {overview?.careers.applicantsToday || 0} • christid: {overview?.careers.christidApplicants || 0}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Intern Operations</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">
              {(overview?.interns.totalWorkLogs || 0) + (overview?.interns.totalReports || 0)}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Logs: {overview?.interns.totalWorkLogs || 0} • Reports: {overview?.interns.totalReports || 0}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Navigation Center</h2>
            <span className="text-xs text-slate-500">One-click access</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#154CB3]/50 hover:bg-white"
              >
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#154CB3]">{link.title}</p>
                <p className="mt-1 text-xs text-slate-600">{link.description}</p>
                <p className="mt-3 text-[11px] font-semibold text-[#154CB3]">Open</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <MiniBarChart title="Accounts Status (Count)" data={accountsChart} />
          <MiniBarChart title="Career Applicant Status" data={careersChart} />
          <MiniBarChart title="Intern Work Log Status" data={internLogsChart} />
          <MiniBarChart title="Intern Report Status" data={reportsChart} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <MiniBarChart title="Mailbox Read/Unread/Starred" data={mailboxChart} />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Mailbox + Interns Snapshot</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Mailbox Notifications</p>
                <p className="mt-1 text-xl font-black text-slate-900">{overview?.mailbox.receivedNotifications || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Tracked: {overview?.mailbox.trackedEmails || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Last Notification</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {overview?.mailbox.lastNotificationAt
                    ? new Date(overview.mailbox.lastNotificationAt).toLocaleString("en-IN")
                    : "No notifications yet"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Intern Logs Today</p>
                <p className="mt-1 text-xl font-black text-slate-900">{overview?.interns.workLogsToday || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Intern Reports Today</p>
                <p className="mt-1 text-xl font-black text-slate-900">{overview?.interns.reportsToday || 0}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
