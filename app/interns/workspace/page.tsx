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
}

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />;
}

export default function InternWorkspace() {
  const [stats, setStats] = useState({
    logsSubmitted: 0,
    reportsSubmitted: 0,
  });
  const [recentLogs, setRecentLogs] = useState<WorkLogItem[]>([]);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = typeof window !== "undefined" ? localStorage.getItem("interns_user") : null;
  const userData = user ? JSON.parse(user) : null;

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

  const quickStats = [
    { label: "Work Logs", value: stats.logsSubmitted },
    { label: "Reports", value: stats.reportsSubmitted },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {userData?.fullName || "Intern"}</h1>
        <p className="text-slate-600">Continue your internship work and track progress.</p>
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
          <p className="text-slate-600 text-sm mb-4">Share daily work and accomplishments.</p>
          <Link href="/interns/workspace/work-logs/new" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition">
            Submit Log
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Issue</h3>
          <p className="text-slate-600 text-sm mb-4">Report bugs or workflow issues.</p>
          <Link href="/interns/workspace/reports/new" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition">
            New Report
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Leaderboard</h3>
          <p className="text-slate-600 text-sm mb-4">View standings and progress.</p>
          <Link href="/interns/workspace/leaderboard" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition">
            View Rankings
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
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{log.progress_status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No work logs submitted yet.</p>
          )}
          <Link href="/interns/workspace/work-logs" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Status</h2>
          {recentReports.length ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-slate-900 font-medium">{report.title}</p>
                    <p className="text-slate-500 text-xs">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">{report.status || report.work_status || "open"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No reports submitted yet.</p>
          )}
          <Link href="/interns/workspace/reports" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>
      </div>
    </div>
  );
}
