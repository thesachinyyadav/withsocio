"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkspaceStats {
  totalPoints: number;
  currentStreak: number;
  maxStreak: number;
  logsSubmitted: number;
  reportsSubmitted: number;
}

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />;
}

export default function InternWorkspace() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = typeof window !== "undefined" ? localStorage.getItem("interns_user") : null;
  const userData = user ? JSON.parse(user) : null;

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalPoints: 120,
        currentStreak: 5,
        maxStreak: 12,
        logsSubmitted: 15,
        reportsSubmitted: 3,
      });
      setLoading(false);
    }, 400);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const quickStats = [
    { label: "Points", value: stats?.totalPoints || 0 },
    { label: "Streak", value: stats?.currentStreak || 0 },
    { label: "Work Logs", value: stats?.logsSubmitted || 0 },
    { label: "Reports", value: stats?.reportsSubmitted || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {userData?.fullName || "Intern"}</h1>
        <p className="text-slate-600">Continue your internship work and track progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-slate-900 font-medium">Work Log #{i}</p>
                  <p className="text-slate-500 text-xs">Today</p>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">Submitted</span>
              </div>
            ))}
          </div>
          <Link href="/interns/workspace/work-logs" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Status</h2>
          <div className="space-y-3">
            {[
              { name: "Bug in form", status: "open" },
              { name: "Feature request", status: "in_progress" },
              { name: "UI improvement", status: "resolved" },
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-slate-900 font-medium">{report.name}</p>
                  <p className="text-slate-500 text-xs">Submitted recently</p>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">{report.status}</span>
              </div>
            ))}
          </div>
          <Link href="/interns/workspace/reports" className="inline-flex mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            View All
          </Link>
        </div>
      </div>
    </div>
  );
}
