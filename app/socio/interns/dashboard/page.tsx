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
  }>;
}

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800" />;
}

function MetricIcon({ type }: { type: "interns" | "logs" | "reports" | "active" }) {
  if (type === "interns") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-800">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "logs") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-800">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "reports") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-800">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-800">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState("");

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
    try {
      setReminderLoading(internEmail);
      const token = localStorage.getItem("interns_token") || "";

      console.log(`[REMINDER] Sending reminder to ${internEmail}`);

      const response = await fetch("/api/interns/admin/send-work-log-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({
          internEmails: [internEmail],
        }),
      });

      const payload = await response.json().catch(() => ({}));

      console.log(`[REMINDER] Response status: ${response.status}`, payload);

      if (!response.ok) {
        const errorMsg = payload?.error || payload?.summary?.failCount ? `Failed to send to some interns (${payload.summary.failCount} failed)` : "Failed to send reminder";
        setReminderError(errorMsg);
        console.error(`[REMINDER] Error:`, errorMsg);
        return;
      }

      const summary = payload?.summary;
      if (summary?.failCount > 0) {
        setReminderError(`Sent to ${summary.successCount}, but ${summary.failCount} failed`);
        console.warn(`[REMINDER] Partial failure:`, payload);
      } else {
        alert("Reminder email sent successfully!");
      }
    } catch (err) {
      console.error(`[REMINDER] Exception:`, err);
      setReminderError("Could not send reminder right now");
    } finally {
      setReminderLoading(null);
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

  const metrics = [
    { label: "Total Interns", value: data.metrics.totalInterns, type: "interns" as const },
    { label: "Work Logs", value: data.metrics.totalLogs, type: "logs" as const },
    { label: "Reports", value: data.metrics.totalReports, type: "reports" as const },
    { label: "Active Today", value: data.metrics.activeToday, type: "active" as const },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Manage interns, reports, and workspace progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MetricIcon type={metric.type} />
            </div>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Reports Overview</h2>
          <div className="space-y-3">
            {[
              { label: "Open", key: "openReports" },
              { label: "In Progress", key: "inProgressReports" },
              { label: "Resolved", key: "resolvedReports" },
              { label: "Closed", key: "closedReports" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-900">{data.statusDistribution[item.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Work Mode Split</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Onsite Logs</span>
              <span className="font-semibold text-slate-900">{data.workModeDistribution?.onsite || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">WFH Logs</span>
              <span className="font-semibold text-slate-900">{data.workModeDistribution?.wfh || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/socio/interns/dashboard/reports" className="block rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">View Reports</Link>
            <Link href="/socio/interns/dashboard/work-logs" className="block rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">View Work Logs</Link>
            <Link href="/socio/interns/dashboard/interns" className="block rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Manage Interns</Link>
            <Link href="/socio/interns/dashboard/send-email" className="block rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Send Email</Link>
            <a href="/api/interns/admin/export?kind=work-logs&format=xlsx" className="block rounded-lg border border-blue-200 bg-blue-100 px-4 py-2 text-sm text-blue-800 hover:bg-blue-200">Export WorkLogs (XLSX)</a>
            <a href="/api/interns/admin/export?kind=work-logs&format=csv" className="block rounded-lg border border-blue-200 bg-blue-100 px-4 py-2 text-sm text-blue-800 hover:bg-blue-200">Export WorkLogs (CSV)</a>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Missed Today&apos;s WorkLog</h2>
          <span className="text-sm text-slate-600">{data.missedWorklogToday?.length || 0} interns</span>
        </div>
        {reminderError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {reminderError}
          </div>
        )}
        {data.missedWorklogToday?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.missedWorklogToday.map((intern) => (
              <div key={intern.email} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{intern.fullName}</p>
                  <p className="text-xs text-slate-600 mt-1">{intern.email}</p>
                </div>
                <button
                  onClick={() => handleSendReminder(intern.email)}
                  disabled={reminderLoading === intern.email}
                  className="ml-3 px-3 py-1 rounded-lg text-xs font-semibold transition bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 hover:disabled:bg-blue-50 whitespace-nowrap"
                >
                  {reminderLoading === intern.email ? "Sending..." : "Remind"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No misses today. Everyone submitted a worklog.</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Performers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left text-slate-500 font-medium">Intern</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Points</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Streak</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Logs</th>
                <th className="px-4 py-2 text-right text-slate-500 font-medium">Reports</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.slice(0, 5).map((intern, idx) => (
                <tr key={intern.email} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-800 font-semibold">#{idx + 1}</span>
                      <span>{intern.email.split("@")[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900 font-semibold">{intern.points}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{intern.streak}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{intern.logsSubmitted}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{intern.reportsResolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {data.recentActivity.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <div>
                <span className="text-slate-700">{activity.actor_email}</span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="text-slate-600">{activity.action}</span>
              </div>
              <span className="text-slate-500 text-xs">{new Date(activity.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
