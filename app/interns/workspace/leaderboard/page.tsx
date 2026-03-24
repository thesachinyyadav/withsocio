"use client";

import React, { useEffect, useState } from "react";

interface LeaderboardEntry {
  email: string;
  points: number;
  streak: number;
  maxStreak: number;
  logsSubmitted: number;
  reportsResolved: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch("/api/interns/admin/dashboard", {
        headers: { "x-interns-token": token || "" },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🏆 Leaderboard</h1>
        <p className="text-slate-400">Top performers in the internship program</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-700/50">
                <th className="px-6 py-4 text-left text-slate-300 font-semibold">Rank</th>
                <th className="px-6 py-4 text-left text-slate-300 font-semibold">Intern</th>
                <th className="px-6 py-4 text-right text-slate-300 font-semibold">Points</th>
                <th className="px-6 py-4 text-right text-slate-300 font-semibold">Streak</th>
                <th className="px-6 py-4 text-right text-slate-300 font-semibold">Work Logs</th>
                <th className="px-6 py-4 text-right text-slate-300 font-semibold">Reports</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={entry.email}
                  className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                >
                  <td className="px-6 py-4 font-bold">
                    {idx === 0 && "🥇"}
                    {idx === 1 && "🥈"}
                    {idx === 2 && "🥉"}
                    {idx > 2 && `#${idx + 1}`}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{entry.email.split("@")[0]}</p>
                      <p className="text-slate-400 text-sm">{entry.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">
                      {entry.points}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-orange-400 font-bold">{entry.streak} 🔥</span>
                  </td>
                  <td className="px-6 py-4 text-right text-blue-400 font-medium">
                    {entry.logsSubmitted}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-400 font-medium">
                    {entry.reportsResolved}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-2">How points are awarded:</p>
          <ul className="text-sm space-y-1 text-slate-300">
            <li>✓ +10 points per work log submitted</li>
            <li>✓ +5 points per report submitted</li>
          </ul>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-2">Streak calculation:</p>
          <ul className="text-sm space-y-1 text-slate-300">
            <li>✓ Consecutive days with submissions</li>
            <li>✓ Max streak tracked for achievement</li>
          </ul>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-2">Benefits of ranking:</p>
          <ul className="text-sm space-y-1 text-slate-300">
            <li>✓ Recognition and visibility</li>
            <li>✓ Performance bonuses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
