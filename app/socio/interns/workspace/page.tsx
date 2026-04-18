"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLogItem {
  id: string;
  title: string;
  log_date: string;
  progress_status: string;
}

interface ReportItem {
  id: string;
  title: string;
  status?: string;
  work_status?: string;
  created_at: string;
  created_by_name?: string;
  created_by_email?: string;
  assigned_to_emails?: string[];
}

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
  const [isAlumni, setIsAlumni] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("interns_user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const fullName = (parsedUser?.fullName || "Intern").trim();
      const firstName = fullName.split(" ")[0] || "Intern";
      const normalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      setDisplayName(normalizedName);
      setIsAlumni(String(parsedUser?.status || "").toLowerCase() === "alumni");

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
          className={`w-full max-w-xl rounded-2xl border border-blue-200 bg-blue-100 p-10 text-center shadow-sm transition-all duration-500 ease-out ${
            splashAnimateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95"
          }`}
        >
          <p className="text-sm font-medium uppercase tracking-wide text-blue-800">SOCIO</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome {displayName}</h1>
          <p className="mt-2 text-slate-600">Good to see you. Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: "Work Logs", value: stats.logsSubmitted },
    { label: "Reports", value: stats.reportsSubmitted },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {displayName}</h1>
        <p className="text-slate-600">
          {isAlumni
            ? "Alumni mode is active. You can view your past work in read-only mode."
            : "Continue your internship work and track progress."}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-100 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-800">
            {isAlumni
              ? "Read-only access: You can review your previous work logs and reports."
              : "Reminder: add your today's worklog before the day ends."}
          </p>
          {!isAlumni ? (
            <Link
              href="/socio/interns/workspace/work-logs/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 transition"
            >
              Add Today's Worklog
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Work Log</h3>
          <p className="text-slate-600 text-sm mb-4">
            {isAlumni ? "Review your submitted work logs." : "Share daily work and accomplishments."}
          </p>
          <Link
            href={isAlumni ? "/socio/interns/workspace/work-logs" : "/socio/interns/workspace/work-logs/new"}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 transition"
          >
            {isAlumni ? "View Logs" : "Submit Log"}
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Issue</h3>
          <p className="text-slate-600 text-sm mb-4">
            {isAlumni ? "Review reports you submitted while active." : "Report bugs or workflow issues."}
          </p>
          <Link
            href={isAlumni ? "/socio/interns/workspace/reports" : "/socio/interns/workspace/reports/new"}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 transition"
          >
            {isAlumni ? "View Reports" : "New Report"}
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">My Profile</h3>
          <p className="text-slate-600 text-sm mb-4">View your calendar and report status.</p>
          <Link href="/socio/interns/workspace/leaderboard" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 transition">
            Open Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Work Logs</h2>
          {recentLogs.length ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-slate-900 font-medium">{log.title}</p>
                    <p className="text-slate-500 text-xs">{log.log_date}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{log.progress_status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No work logs submitted yet.</p>
          )}
          <Link href="/socio/interns/workspace/work-logs" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Status</h2>
          {recentReports.length ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="py-3 border-b border-slate-100 last:border-0">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <p className="text-slate-900 font-medium">{report.title}</p>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 whitespace-nowrap">
                      {report.status || report.work_status || "open"}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">
                      Raised by {report.created_by_name || report.created_by_email || "Unknown"}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Working on: {report.assigned_to_emails?.length ? report.assigned_to_emails.join(", ") : "Unassigned"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No reports submitted yet.</p>
          )}
          <Link href="/socio/interns/workspace/reports" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>
      </div>
    </div>
  );
}
