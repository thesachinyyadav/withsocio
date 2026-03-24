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

export default function InternWorkspace() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = typeof window !== "undefined" ? localStorage.getItem("interns_user") : null;
  const userData = user ? JSON.parse(user) : null;

  useEffect(() => {
    // In a real app, fetch user gamification stats
    setTimeout(() => {
      setStats({
        totalPoints: 120,
        currentStreak: 5,
        maxStreak: 12,
        logsSubmitted: 15,
        reportsSubmitted: 3,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const quickStats = [
    { label: "Points", value: stats?.totalPoints || 0, icon: "⭐", color: "emerald" },
    { label: "Streak", value: `${stats?.currentStreak || 0}🔥`, icon: "🔥", color: "orange" },
    { label: "Work Logs", value: stats?.logsSubmitted || 0, icon: "📝", color: "blue" },
    { label: "Reports", value: stats?.reportsSubmitted || 0, icon: "🐛", color: "rose" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome, {userData?.fullName}! 👋
        </h1>
        <p className="text-slate-400">Continue your internship journey and track your progress</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat) => {
          const colorClasses: Record<string, string> = {
            emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
            blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
          };

          return (
            <div
              key={stat.label}
              className={`border rounded-xl p-6 ${colorClasses[stat.color]}`}
            >
              <p className="text-sm opacity-80 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Submit Work Log */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">📝 Work Log</h3>
          <p className="text-slate-400 text-sm mb-4">Share your daily work and accomplishments</p>
          <Link href="/interns/workspace/work-logs/new">
            <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
              Submit Log
            </button>
          </Link>
        </div>

        {/* Submit Report */}
        <div className="lg:col-span-1 bg-gradient-to-br from-rose-500/20 to-rose-500/5 border border-rose-500/30 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">🐛 Report Issue</h3>
          <p className="text-slate-400 text-sm mb-4">Report bugs or suggest improvements</p>
          <Link href="/interns/workspace/reports/new">
            <button className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition">
              New Report
            </button>
          </Link>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">🏆 Leaderboard</h3>
          <p className="text-slate-400 text-sm mb-4">See top performers and compete</p>
          <Link href="/interns/workspace/leaderboard">
            <button className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition">
              View Rankings
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Work Logs</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-white font-medium">Work Log #{i}</p>
                  <p className="text-slate-400 text-xs">Today</p>
                </div>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  Submitted
                </span>
              </div>
            ))}
          </div>
          <Link href="/interns/workspace/work-logs">
            <button className="w-full mt-4 px-4 py-2 text-blue-400 hover:bg-slate-700/50 rounded-lg transition">
              View All →
            </button>
          </Link>
        </div>

        {/* Report Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Reports Status</h2>
          <div className="space-y-3">
            {[
              { name: "Bug in form", status: "open", color: "blue" },
              { name: "Feature request", status: "in_progress", color: "yellow" },
              { name: "UI improvement", status: "resolved", color: "emerald" },
            ].map((report, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-white font-medium">{report.name}</p>
                  <p className="text-slate-400 text-xs">Submitted 2 days ago</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs  ${
                    report.color === "blue"
                      ? "bg-blue-500/20 text-blue-400"
                      : report.color === "yellow"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {report.status}
                </span>
              </div>
            ))}
          </div>
          <Link href="/interns/workspace/reports">
            <button className="w-full mt-4 px-4 py-2 text-emerald-400 hover:bg-slate-700/50 rounded-lg transition">
              View All →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
