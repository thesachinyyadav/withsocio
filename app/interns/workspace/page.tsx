"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLogItem {
  id: string;
  title: string;
  log_date: string;
  progress_status: string;
  total_hours: number | null;
  attachments?: { name: string; url: string; type: string }[];
}

interface ReportItem {
  id: string;
  title: string;
  status?: string;
  work_status?: string;
  priority?: string;
  created_at: string;
  created_by_name?: string;
  created_by_email?: string;
  assigned_to_emails?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
  reviewed: "bg-purple-100 text-purple-800",
  open: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-600",
};

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800" />;
}

export default function InternWorkspace() {
  const [stats, setStats] = useState({
    logsSubmitted: 0,
    reportsSubmitted: 0,
  });
  const [recentLogs, setRecentLogs] = useState<WorkLogItem[]>([]);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const [splashAnimateIn, setSplashAnimateIn] = useState(false);
  const [displayName, setDisplayName] = useState("Intern");

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("interns_user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const fullName = (parsedUser?.fullName || "Intern").trim();
      const firstName = fullName.split(" ")[0] || "Intern";
      const normalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      setDisplayName(normalizedName);

      const hasSeenWelcome = sessionStorage.getItem("interns_welcome_seen") === "true";
      if (!hasSeenWelcome) {
        setShowWelcomeSplash(true);
        setTimeout(() => setSplashAnimateIn(true), 30);
        const timeout = setTimeout(() => {
          setSplashAnimateIn(false);
          setShowWelcomeSplash(false);
          sessionStorage.setItem("interns_welcome_seen", "true");
        }, 1500);
        return () => clearTimeout(timeout);
      }
    } catch {
      setDisplayName("Intern");
    }
  }, []);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const token = localStorage.getItem("interns_token") || "";

        const [logsRes, reportsRes] = await Promise.all([
          fetch("/api/interns/work-logs?page=1&limit=5", {
            headers: { "x-interns-token": token },
          }),
          fetch("/api/interns/reports?page=1&limit=5", {
            headers: { "x-interns-token": token },
          }),
        ]);

        const logsPayload = await logsRes.json().catch(() => ({}));
        const reportsPayload = await reportsRes.json().catch(() => ({}));

        const logsData = Array.isArray(logsPayload?.data) ? logsPayload.data : [];
        const reportsData = Array.isArray(reportsPayload?.data) ? reportsPayload.data : [];

        setRecentLogs(logsData);
        setRecentReports(reportsData);
        setStats({
          logsSubmitted: logsPayload?.pagination?.total || 0,
          reportsSubmitted: reportsPayload?.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to load workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (showWelcomeSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className={`w-full max-w-xl rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-10 text-center shadow-lg transition-all duration-500 ease-out ${
            splashAnimateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 mb-4">
            <svg className="w-7 h-7 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-800">SOCIO</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome {displayName}</h1>
          <p className="mt-2 text-slate-600">Good to see you. Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-blue-700 text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">{displayName}&apos;s Workspace</h1>
        <p className="text-slate-500 text-sm">Track your progress and submit daily work.</p>
      </div>

      {/* Worklog Reminder Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-200">
              <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-800">Remember to add your today&apos;s worklog before the day ends.</p>
          </div>
          <Link
            href="/interns/workspace/work-logs/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Worklog
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.logsSubmitted}</p>
          <p className="text-xs text-slate-500 mt-1">Work Logs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.reportsSubmitted}</p>
          <p className="text-xs text-slate-500 mt-1">Reports Filed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-100">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {recentLogs.reduce((sum, l) => sum + (l.total_hours || 0), 0).toFixed(1)}h
          </p>
          <p className="text-xs text-slate-500 mt-1">Hours (Recent)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100">
              <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {recentLogs.filter((l) => Array.isArray(l.attachments) && l.attachments.length > 0).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">With Attachments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/interns/workspace/work-logs/new" className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 mb-3 group-hover:bg-blue-200 transition">
            <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Submit Work Log</h3>
          <p className="text-slate-500 text-sm">Share daily work and accomplishments.</p>
        </Link>

        <Link href="/interns/workspace/reports/new" className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 mb-3 group-hover:bg-amber-200 transition">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Report Issue</h3>
          <p className="text-slate-500 text-sm">Report bugs or workflow issues.</p>
        </Link>

        <Link href="/interns/workspace/leaderboard" className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 mb-3 group-hover:bg-purple-200 transition">
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">My Profile</h3>
          <p className="text-slate-500 text-sm">View your calendar and leaderboard.</p>
        </Link>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Work Logs</h2>
            <Link href="/interns/workspace/work-logs" className="text-xs text-blue-700 hover:text-blue-800 font-medium transition">View All →</Link>
          </div>
          {recentLogs.length ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-900 font-medium text-sm truncate">{log.title}</p>
                      {Array.isArray(log.attachments) && log.attachments.length > 0 && (
                        <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{log.log_date}{log.total_hours ? ` • ${log.total_hours}h` : ""}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ml-3 whitespace-nowrap ${STATUS_COLORS[log.progress_status] || "bg-blue-100 text-blue-800"}`}>
                    {log.progress_status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4">No work logs submitted yet.</p>
          )}
        </div>

        {/* Report Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Report Status</h2>
            <Link href="/interns/workspace/reports" className="text-xs text-blue-700 hover:text-blue-800 font-medium transition">View All →</Link>
          </div>
          {recentReports.length ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 font-medium text-sm truncate">{report.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-400 text-xs">
                          {report.created_by_name || report.created_by_email || "Unknown"}
                        </p>
                        {report.priority && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            report.priority === "critical" ? "bg-red-100 text-red-700" :
                            report.priority === "high" ? "bg-orange-100 text-orange-700" :
                            report.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {report.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${STATUS_COLORS[report.status || "open"] || "bg-blue-100 text-blue-800"}`}>
                      {(report.status || report.work_status || "open").replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4">No reports submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
