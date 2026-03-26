"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardMetrics {
  metrics: {
    totalLogs: number;
    totalReports: number;
    totalInterns: number;
    activeToday: number;
  };
  statusDistribution: Record<string, number>;
  workModeDistribution?: {
    onsite: number;
    wfh: number;
  };
  missedWorklogToday?: Array<{
    fullName: string;
    email: string;
  }>;
  leaderboard: Array<{
    email: string;
    points: number;
    streak: number;
    logsSubmitted: number;
    reportsResolved: number;
  }>;
  recentActivity: Array<{
    id: string;
    actor_email: string;
    action: string;
    created_at: string;
    target_type?: string;
  }>;
}

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800" />;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function MetricCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  WORK_LOG_CREATED: { label: "Submitted work log", color: "text-blue-600" },
  REPORT_CREATED: { label: "Filed report", color: "text-amber-600" },
  STATUS_UPDATED: { label: "Updated status", color: "text-purple-600" },
  WORK_LOG_STATUS_UPDATED: { label: "Updated work log", color: "text-green-600" },
  REPORT_STATUS_UPDATED: { label: "Updated report", color: "text-green-600" },
  REPORT_ASSIGNED: { label: "Assigned report", color: "text-indigo-600" },
  EMAIL_SENT: { label: "Sent email", color: "text-cyan-600" },
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [bulkReminderLoading, setBulkReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [reminderSuccess, setReminderSuccess] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch("/api/interns/admin/dashboard", {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard");

      const dashboardData = await response.json();
      setData(dashboardData);
      setError("");
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (internEmail: string) => {
    setReminderError("");
    setReminderSuccess("");
    try {
      setReminderLoading(internEmail);
      const token = localStorage.getItem("interns_token") || "";

      const response = await fetch("/api/interns/admin/send-work-log-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({ internEmails: [internEmail] }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReminderError(payload?.error || "Failed to send reminder");
        return;
      }

      const summary = payload?.summary;
      if (summary?.failCount > 0) {
        setReminderError(`Sent to ${summary.successCount}, but ${summary.failCount} failed`);
      } else {
        setReminderSuccess(`Reminder sent to ${internEmail}`);
        setTimeout(() => setReminderSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setReminderError("Could not send reminder right now");
    } finally {
      setReminderLoading(null);
    }
  };

  const handleBulkRemind = async () => {
    if (!data?.missedWorklogToday?.length) return;
    setReminderError("");
    setReminderSuccess("");
    setBulkReminderLoading(true);

    try {
      const token = localStorage.getItem("interns_token") || "";
      const allEmails = data.missedWorklogToday.map((i) => i.email);

      const response = await fetch("/api/interns/admin/send-work-log-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({ internEmails: allEmails }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReminderError(payload?.error || "Failed to send bulk reminders");
        return;
      }

      const summary = payload?.summary;
      if (summary?.failCount > 0) {
        setReminderSuccess(`Sent ${summary.successCount} reminders, ${summary.failCount} failed`);
      } else {
        setReminderSuccess(`✓ Reminders sent to all ${allEmails.length} interns`);
      }
      setTimeout(() => setReminderSuccess(""), 5000);
    } catch (err) {
      console.error(err);
      setReminderError("Could not send bulk reminders");
    } finally {
      setBulkReminderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || "Failed to load dashboard"}
        </div>
      </div>
    );
  }

  const totalLogs = data.workModeDistribution
    ? data.workModeDistribution.onsite + data.workModeDistribution.wfh
    : data.metrics.totalLogs;

  const onsitePercent = totalLogs > 0 ? Math.round(((data.workModeDistribution?.onsite || 0) / totalLogs) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Command Center</h1>
              <p className="text-slate-500 text-sm">Manage interns, reports, and workspace progress.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Interns"
          value={data.metrics.totalInterns}
          color="bg-blue-100"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-800">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Work Logs"
          value={data.metrics.totalLogs}
          color="bg-green-100"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-green-700">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Reports"
          value={data.metrics.totalReports}
          color="bg-amber-100"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-amber-700">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Active Today"
          value={data.metrics.activeToday}
          color="bg-purple-100"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-purple-700">
              <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* Reports + Work Mode + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Reports Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Reports Overview</h2>
          <div className="space-y-3">
            {[
              { label: "Open", key: "openReports", color: "bg-orange-500" },
              { label: "In Progress", key: "inProgressReports", color: "bg-blue-500" },
              { label: "Resolved", key: "resolvedReports", color: "bg-green-500" },
              { label: "Closed", key: "closedReports", color: "bg-slate-400" },
            ].map((item) => {
              const count = data.statusDistribution[item.key] || 0;
              const totalReports = Object.values(data.statusDistribution).reduce((a, b) => a + b, 0) || 1;
              const percent = Math.round((count / totalReports) * 100);
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Mode Split */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Work Mode</h2>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#1e40af" strokeWidth="3"
                  strokeDasharray={`${onsitePercent} ${100 - onsitePercent}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{totalLogs}</span>
                <span className="text-[10px] text-slate-500">Total</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-800" />
              <span className="text-slate-700">Onsite</span>
              <span className="ml-auto font-semibold text-slate-900">{data.workModeDistribution?.onsite || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-slate-700">WFH</span>
              <span className="ml-auto font-semibold text-slate-900">{data.workModeDistribution?.wfh || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/interns/dashboard/reports" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              View Reports
            </Link>
            <Link href="/interns/dashboard/work-logs" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              View Work Logs
            </Link>
            <Link href="/interns/dashboard/interns" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Manage Interns
            </Link>
            <Link href="/interns/dashboard/send-email" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Send Email
            </Link>
          </div>

          {/* Exports */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-2">EXPORT DATA</p>
            <div className="grid grid-cols-2 gap-2">
              <a href="/api/interns/admin/export?kind=work-logs&format=xlsx" className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 hover:bg-blue-100 transition font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Logs XLSX
              </a>
              <a href="/api/interns/admin/export?kind=work-logs&format=csv" className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 hover:bg-blue-100 transition font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Logs CSV
              </a>
              <a href="/api/interns/admin/export?kind=reports&format=xlsx" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 hover:bg-green-100 transition font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Reports XLSX
              </a>
              <a href="/api/interns/admin/export?kind=reports&format=csv" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 hover:bg-green-100 transition font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Reports CSV
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Missed Worklog */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Missed Today&apos;s WorkLog</h2>
              <p className="text-xs text-slate-500">{data.missedWorklogToday?.length || 0} interns haven&apos;t submitted</p>
            </div>
          </div>
          {(data.missedWorklogToday?.length || 0) > 1 && (
            <button
              onClick={handleBulkRemind}
              disabled={bulkReminderLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
            >
              {bulkReminderLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Remind All ({data.missedWorklogToday?.length})
                </>
              )}
            </button>
          )}
        </div>

        {reminderError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {reminderError}
          </div>
        )}
        {reminderSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {reminderSuccess}
          </div>
        )}

        {data.missedWorklogToday?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.missedWorklogToday.map((intern) => (
              <div key={intern.email} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{intern.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{intern.email}</p>
                </div>
                <button
                  onClick={() => handleSendReminder(intern.email)}
                  disabled={reminderLoading === intern.email || bulkReminderLoading}
                  className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {reminderLoading === intern.email ? "Sending..." : "Remind"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-slate-500 flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All interns have submitted today&apos;s worklog!
          </div>
        )}
      </div>

      {/* Leaderboard + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
              <path d="M19 19H5a1 1 0 01-1-1v-1h16v1a1 1 0 01-1 1z" />
            </svg>
            <h2 className="text-base font-semibold text-slate-900">Top Performers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">#</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Intern</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Points</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">🔥</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Logs</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.slice(0, 8).map((intern, idx) => (
                  <tr key={intern.email} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5">
                      {idx < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-amber-100 text-amber-800" :
                          idx === 1 ? "bg-slate-200 text-slate-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs ml-1.5">{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-900 font-medium">{intern.email.split("@")[0]}</td>
                    <td className="px-3 py-2.5 text-right text-slate-900 font-semibold">{intern.points}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{intern.streak}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{intern.logsSubmitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {data.recentActivity.slice(0, 12).map((activity) => {
              const actionInfo = ACTION_LABELS[activity.action] || { label: activity.action.replace(/_/g, " ").toLowerCase(), color: "text-slate-600" };
              return (
                <div key={activity.id} className="flex items-center justify-between text-sm py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition rounded-lg px-2 -mx-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {activity.actor_email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-800 font-medium text-xs">{activity.actor_email.split("@")[0]}</span>
                      <span className={`ml-2 text-xs ${actionInfo.color}`}>{actionInfo.label}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs whitespace-nowrap ml-3">{relativeTime(activity.created_at)}</span>
                </div>
              );
            })}
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
