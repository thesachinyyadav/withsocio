"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Role = "intern" | "admin";

type SessionState = {
  role: Role;
  token: string;
  user: {
    id?: string;
    email: string | null;
    fullName: string;
  };
};

type WorkLog = {
  id: string;
  log_date: string;
  title: string;
  description: string;
  collaborated_with: string | null;
  progress_status: string;
  created_by_email: string;
  created_by_name?: string;
  admin_notes: string | null;
};

type ReportItem = {
  id: string;
  category: string;
  title: string;
  details: string;
  work_status: string;
  priority: string;
  created_by_email: string;
  created_by_name?: string;
  admin_notes: string | null;
};

type SummaryData = {
  totals: {
    totalLogs: number;
    totalReports: number;
    openReports: number;
    blockedLogs: number;
  };
  recentActivity: Array<{
    id: string;
    type: "work_log" | "report";
    title: string;
    status: string;
    createdByEmail: string;
    createdAt: string;
  }>;
};

const SESSION_KEY = "interns_session_v1";
const PAGE_SIZE = 20;
const WORK_LOG_STATUS_OPTIONS = ["submitted", "in_progress", "completed", "blocked", "reviewed"];
const REPORT_STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const REPORT_CATEGORY_OPTIONS = ["feature", "bug", "issue", "problem"];
const REPORT_PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

export default function InternsPage() {
  const [identifier, setIdentifier] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);

  const [workLogForm, setWorkLogForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    title: "",
    description: "",
    collaboratedWith: "",
  });

  const [reportForm, setReportForm] = useState({
    category: "feature",
    title: "",
    details: "",
    workStatus: "open",
    priority: "medium",
  });

  const [logFilters, setLogFilters] = useState({
    status: "",
    email: "",
    from: "",
    to: "",
    q: "",
    page: 1,
  });

  const [reportFilters, setReportFilters] = useState({
    category: "",
    status: "",
    priority: "",
    email: "",
    from: "",
    to: "",
    q: "",
    page: 1,
  });

  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [workLogsTotal, setWorkLogsTotal] = useState(0);
  const [reportsTotal, setReportsTotal] = useState(0);

  const [loadingWorkLogs, setLoadingWorkLogs] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submittingWorkLog, setSubmittingWorkLog] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [globalMessage, setGlobalMessage] = useState("");
  const [globalError, setGlobalError] = useState("");

  const isAdmin = session?.role === "admin";

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-interns-token": session?.token || "",
    }),
    [session?.token]
  );

  const buildWorkLogQuery = useCallback(() => {
    const params = new URLSearchParams({ page: String(logFilters.page), limit: String(PAGE_SIZE) });
    if (logFilters.status) params.set("status", logFilters.status);
    if (logFilters.email) params.set("email", logFilters.email.trim());
    if (logFilters.from) params.set("from", logFilters.from);
    if (logFilters.to) params.set("to", logFilters.to);
    if (logFilters.q.trim()) params.set("q", logFilters.q.trim());
    return params.toString();
  }, [logFilters]);

  const buildReportQuery = useCallback(() => {
    const params = new URLSearchParams({ page: String(reportFilters.page), limit: String(PAGE_SIZE) });
    if (reportFilters.category) params.set("category", reportFilters.category);
    if (reportFilters.status) params.set("status", reportFilters.status);
    if (reportFilters.priority) params.set("priority", reportFilters.priority);
    if (reportFilters.email) params.set("email", reportFilters.email.trim());
    if (reportFilters.from) params.set("from", reportFilters.from);
    if (reportFilters.to) params.set("to", reportFilters.to);
    if (reportFilters.q.trim()) params.set("q", reportFilters.q.trim());
    return params.toString();
  }, [reportFilters]);

  const fetchWorkLogs = useCallback(async () => {
    if (!session?.token) return;
    setLoadingWorkLogs(true);
    try {
      const response = await fetch(`/api/interns/work-logs?${buildWorkLogQuery()}`, {
        headers: { "x-interns-token": session.token },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to fetch work logs.");
      setWorkLogs(payload?.data || []);
      setWorkLogsTotal(payload?.pagination?.total || 0);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to fetch work logs.");
    } finally {
      setLoadingWorkLogs(false);
    }
  }, [buildWorkLogQuery, session?.token]);

  const fetchReports = useCallback(async () => {
    if (!session?.token) return;
    setLoadingReports(true);
    try {
      const response = await fetch(`/api/interns/reports?${buildReportQuery()}`, {
        headers: { "x-interns-token": session.token },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to fetch reports.");
      setReports(payload?.data || []);
      setReportsTotal(payload?.pagination?.total || 0);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to fetch reports.");
    } finally {
      setLoadingReports(false);
    }
  }, [buildReportQuery, session?.token]);

  const fetchSummary = useCallback(async () => {
    if (!session?.token || !isAdmin) return;
    setLoadingSummary(true);
    try {
      const response = await fetch("/api/interns/admin/summary", {
        headers: { "x-interns-token": session.token },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to fetch summary.");
      setSummary(payload);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to fetch summary.");
    } finally {
      setLoadingSummary(false);
    }
  }, [isAdmin, session?.token]);

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SessionState;
      if (parsed?.role && parsed?.token) {
        setSession(parsed);
      }
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    fetchWorkLogs();
  }, [session?.token, fetchWorkLogs]);

  useEffect(() => {
    if (!session?.token) return;
    fetchReports();
  }, [session?.token, fetchReports]);

  useEffect(() => {
    if (!session?.token || !isAdmin) return;
    fetchSummary();
  }, [session?.token, isAdmin, fetchSummary]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setGlobalError("");
    setGlobalMessage("");

    if (!identifier.trim()) {
      setAuthError("Please enter an email or username.");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch("/api/interns/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to login.");

      const nextSession: SessionState = {
        role: payload.role,
        token: payload.token,
        user: {
          id: payload?.user?.id,
          email: payload?.user?.email ?? null,
          fullName: payload?.user?.fullName || "Workspace User",
        },
      };

      setSession(nextSession);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setIdentifier("");
      setGlobalMessage(`Welcome, ${nextSession.user.fullName}.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to login.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setSummary(null);
    setWorkLogs([]);
    setReports([]);
    setWorkLogsTotal(0);
    setReportsTotal(0);
    setGlobalMessage("Logged out.");
    window.localStorage.removeItem(SESSION_KEY);
  };

  const handleWorkLogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError("");
    setGlobalMessage("");

    if (!workLogForm.logDate || !workLogForm.title.trim() || !workLogForm.description.trim()) {
      setGlobalError("Please fill in date, title, and description for the work log.");
      return;
    }

    setSubmittingWorkLog(true);
    try {
      const response = await fetch("/api/interns/work-logs", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          logDate: workLogForm.logDate,
          title: workLogForm.title.trim(),
          description: workLogForm.description.trim(),
          collaboratedWith: workLogForm.collaboratedWith.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to submit work log.");

      setWorkLogForm({
        ...workLogForm,
        title: "",
        description: "",
        collaboratedWith: "",
      });
      setGlobalMessage("Work log submitted.");
      await fetchWorkLogs();
      if (isAdmin) await fetchSummary();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to submit work log.");
    } finally {
      setSubmittingWorkLog(false);
    }
  };

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGlobalError("");
    setGlobalMessage("");

    if (!reportForm.category || !reportForm.title.trim() || !reportForm.details.trim()) {
      setGlobalError("Please fill in category, title, and details for the report.");
      return;
    }

    setSubmittingReport(true);
    try {
      const response = await fetch("/api/interns/reports", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          category: reportForm.category,
          title: reportForm.title.trim(),
          details: reportForm.details.trim(),
          workStatus: reportForm.workStatus,
          priority: reportForm.priority,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to submit report.");

      setReportForm({
        ...reportForm,
        title: "",
        details: "",
      });
      setGlobalMessage("Report submitted.");
      await fetchReports();
      if (isAdmin) await fetchSummary();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const updateWorkLogStatus = async (id: string, status: string) => {
    const adminNotes = window.prompt("Add admin notes (optional):", "") ?? "";
    try {
      const response = await fetch(`/api/interns/work-logs/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status, adminNotes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to update status.");
      setGlobalMessage("Work log status updated.");
      await fetchWorkLogs();
      await fetchSummary();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to update status.");
    }
  };

  const updateReportStatus = async (id: string, status: string) => {
    const adminNotes = window.prompt("Add admin notes (optional):", "") ?? "";
    try {
      const response = await fetch(`/api/interns/reports/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status, adminNotes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to update status.");
      setGlobalMessage("Report status updated.");
      await fetchReports();
      await fetchSummary();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to update status.");
    }
  };

  const exportData = async (kind: "work-logs" | "reports", format: "csv" | "xlsx") => {
    try {
      const params =
        kind === "work-logs"
          ? new URLSearchParams({
              kind,
              format,
              status: logFilters.status,
              email: logFilters.email,
              from: logFilters.from,
              to: logFilters.to,
              q: logFilters.q,
            })
          : new URLSearchParams({
              kind,
              format,
              category: reportFilters.category,
              status: reportFilters.status,
              priority: reportFilters.priority,
              email: reportFilters.email,
              from: reportFilters.from,
              to: reportFilters.to,
              q: reportFilters.q,
            });

      const response = await fetch(`/api/interns/admin/export?${params.toString()}`, {
        headers: { "x-interns-token": session?.token || "" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to export data.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}_export.${format === "xlsx" ? "xlsx" : "csv"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setGlobalMessage(`${kind} exported as ${format.toUpperCase()}.`);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to export data.");
    }
  };

  const renderPagination = (
    page: number,
    total: number,
    onPrev: () => void,
    onNext: () => void
  ) => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {page} of {totalPages} • {total} records
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Interns Workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Login with your hired intern email. Admin login uses username <strong>socio2026</strong>.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email or username</label>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                placeholder="name@example.com or socio2026"
              />
            </div>
            {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {authLoading ? "Signing in..." : "Enter workspace"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Interns Workspace</h1>
              <p className="mt-1 text-sm text-slate-600">
                Logged in as {session.user.fullName}
                {session.user.email ? ` (${session.user.email})` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isAdmin ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isAdmin ? "Interns Admin" : "Intern"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
          {globalMessage ? <p className="mt-3 text-sm text-emerald-600">{globalMessage}</p> : null}
          {globalError ? <p className="mt-2 text-sm text-rose-600">{globalError}</p> : null}
        </header>

        {isAdmin ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Admin Command Center</h2>
              <button
                type="button"
                onClick={fetchSummary}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                {loadingSummary ? "Refreshing..." : "Refresh summary"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Total Work Logs</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.totals.totalLogs ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Total Reports</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.totals.totalReports ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Open Reports</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{summary?.totals.openReports ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Blocked Logs</p>
                <p className="mt-1 text-2xl font-bold text-rose-700">{summary?.totals.blockedLogs ?? 0}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Work Logs</h2>
            <form onSubmit={handleWorkLogSubmit} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={workLogForm.logDate}
                  onChange={(event) => setWorkLogForm((prev) => ({ ...prev, logDate: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={workLogForm.collaboratedWith}
                  onChange={(event) =>
                    setWorkLogForm((prev) => ({ ...prev, collaboratedWith: event.target.value }))
                  }
                  placeholder="Collaborated with"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <input
                value={workLogForm.title}
                onChange={(event) => setWorkLogForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={workLogForm.description}
                onChange={(event) => setWorkLogForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                placeholder="Description"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submittingWorkLog}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingWorkLog ? "Submitting..." : "Submit Work Log"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Feature / Bug / Issue Reporting</h2>
            <form onSubmit={handleReportSubmit} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={reportForm.category}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {REPORT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={reportForm.workStatus}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, workStatus: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {REPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={reportForm.priority}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, priority: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {REPORT_PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={reportForm.title}
                onChange={(event) => setReportForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={reportForm.details}
                onChange={(event) => setReportForm((prev) => ({ ...prev, details: event.target.value }))}
                rows={4}
                placeholder="Details"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submittingReport}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Work Logs Feed</h2>
            {isAdmin ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportData("work-logs", "csv")}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportData("work-logs", "xlsx")}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export XLSX
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <input
              placeholder="Search"
              value={logFilters.q}
              onChange={(event) => setLogFilters((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              value={logFilters.email}
              onChange={(event) => setLogFilters((prev) => ({ ...prev, email: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={logFilters.from}
              onChange={(event) => setLogFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={logFilters.to}
              onChange={(event) => setLogFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={logFilters.status}
              onChange={(event) => setLogFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {WORK_LOG_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Collaborated</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Admin Notes</th>
                </tr>
              </thead>
              <tbody>
                {loadingWorkLogs ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                      Loading work logs...
                    </td>
                  </tr>
                ) : workLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                      No work logs found.
                    </td>
                  </tr>
                ) : (
                  workLogs.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 align-top">
                      <td className="px-3 py-2">{row.log_date}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{row.title}</td>
                      <td className="px-3 py-2 text-slate-700">{row.description}</td>
                      <td className="px-3 py-2 text-slate-700">{row.collaborated_with || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.created_by_name || row.created_by_email}
                        <div className="text-xs text-slate-500">{row.created_by_email}</div>
                      </td>
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <select
                            value={row.progress_status}
                            onChange={(event) => updateWorkLogStatus(row.id, event.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          >
                            {WORK_LOG_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {row.progress_status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.admin_notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(
            logFilters.page,
            workLogsTotal,
            () => setLogFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) })),
            () => setLogFilters((prev) => ({ ...prev, page: prev.page + 1 }))
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Reports Feed</h2>
            {isAdmin ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportData("reports", "csv")}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportData("reports", "xlsx")}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export XLSX
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-7">
            <input
              placeholder="Search"
              value={reportFilters.q}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              value={reportFilters.email}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, email: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={reportFilters.category}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, category: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {REPORT_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={reportFilters.status}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={reportFilters.priority}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, priority: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All priorities</option>
              {REPORT_PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={reportFilters.from}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={reportFilters.to}
              onChange={(event) => setReportFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Details</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">By</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Admin Notes</th>
                </tr>
              </thead>
              <tbody>
                {loadingReports ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 align-top">
                      <td className="px-3 py-2 capitalize">{row.category}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{row.title}</td>
                      <td className="px-3 py-2 text-slate-700">{row.details}</td>
                      <td className="px-3 py-2 capitalize text-slate-700">{row.priority}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.created_by_name || row.created_by_email}
                        <div className="text-xs text-slate-500">{row.created_by_email}</div>
                      </td>
                      <td className="px-3 py-2">
                        {isAdmin ? (
                          <select
                            value={row.work_status}
                            onChange={(event) => updateReportStatus(row.id, event.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          >
                            {REPORT_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {row.work_status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.admin_notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(
            reportFilters.page,
            reportsTotal,
            () => setReportFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) })),
            () => setReportFilters((prev) => ({ ...prev, page: prev.page + 1 }))
          )}
        </section>
      </div>
    </main>
  );
}
