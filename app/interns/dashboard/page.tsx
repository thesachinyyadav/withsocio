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
  priorityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  leaderboard: Array<{
    email: string;
    points: number;
    streak: number;
    maxStreak: number;
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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-lg">
          {error || "Failed to load dashboard"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage interns, reports, and track progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Interns"
          value={data.metrics.totalInterns}
          icon="👥"
          color="emerald"
        />
        <MetricCard
          label="Work Logs"
          value={data.metrics.totalLogs}
          icon="📝"
          color="blue"
        />
        <MetricCard
          label="Reports"
          value={data.metrics.totalReports}
          icon="🐛"
          color="rose"
        />
        <MetricCard
          label="Active Today"
          value={data.metrics.activeToday}
          icon="⚡"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status Overview */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Reports Overview</h2>
          <div className="space-y-3">
            {[
              { label: "Open", key: "openReports", color: "bg-blue-500" },
              { label: "In Progress", key: "inProgressReports", color: "bg-yellow-500" },
              { label: "Resolved", key: "resolvedReports", color: "bg-emerald-500" },
              { label: "Closed", key: "closedReports", color: "bg-slate-500" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-slate-300">{item.label}</span>
                </div>
                <span className="font-bold text-white">
                  {data.statusDistribution[item.key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/interns/dashboard/reports">
              <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition text-sm font-medium">
                View Reports
              </button>
            </Link>
            <Link href="/interns/dashboard/work-logs">
              <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm font-medium">
                View Work Logs
              </button>
            </Link>
            <Link href="/interns/dashboard/interns">
              <button className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition text-sm font-medium">
                Manage Interns
              </button>
            </Link>
            <Link href="/interns/dashboard/send-email">
              <button className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition text-sm font-medium">
                Send Email
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Top Performers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Intern</th>
                <th className="px-4 py-2 text-right text-slate-400 font-medium">Points</th>
                <th className="px-4 py-2 text-right text-slate-400 font-medium">Streak</th>
                <th className="px-4 py-2 text-right text-slate-400 font-medium">Logs</th>
                <th className="px-4 py-2 text-right text-slate-400 font-medium">Reports</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.slice(0, 5).map((intern, idx) => (
                <tr key={intern.email} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-4 py-3 text-white">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                      <span>{intern.email.split("@")[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{intern.points}</td>
                  <td className="px-4 py-3 text-right text-orange-400">{intern.streak} 🔥</td>
                  <td className="px-4 py-3 text-right text-blue-400">{intern.logsSubmitted}</td>
                  <td className="px-4 py-3 text-right text-rose-400">{intern.reportsResolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {data.recentActivity.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/50 last:border-0">
              <div>
                <span className="text-slate-400">{activity.actor_email}</span>
                <span className="text-slate-500 mx-2">•</span>
                <span className="text-slate-300">{activity.action}</span>
              </div>
              <span className="text-slate-500 text-xs">
                {new Date(activity.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) => {
  const colorClasses = {
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className={`border rounded-xl p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};
