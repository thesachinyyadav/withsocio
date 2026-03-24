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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Leaderboard</h1>
        <p className="text-slate-600">Top performers in the internship program</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-slate-600 font-semibold">Rank</th>
                <th className="px-6 py-4 text-left text-slate-600 font-semibold">Intern</th>
                <th className="px-6 py-4 text-right text-slate-600 font-semibold">Points</th>
                <th className="px-6 py-4 text-right text-slate-600 font-semibold">Streak</th>
                <th className="px-6 py-4 text-right text-slate-600 font-semibold">Work Logs</th>
                <th className="px-6 py-4 text-right text-slate-600 font-semibold">Reports</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr
                  key={entry.email}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-4 font-bold text-slate-700">
                    #{idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 font-medium">{entry.email.split("@")[0]}</p>
                      <p className="text-slate-500 text-sm">{entry.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold">
                      {entry.points}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-slate-700 font-bold">{entry.streak}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700 font-medium">
                    {entry.logsSubmitted}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700 font-medium">
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-600 text-sm mb-2">How points are awarded:</p>
          <ul className="text-sm space-y-1 text-slate-700">
            <li>+10 points per work log submitted</li>
            <li>+5 points per report submitted</li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-600 text-sm mb-2">Streak calculation:</p>
          <ul className="text-sm space-y-1 text-slate-700">
            <li>Consecutive days with submissions</li>
            <li>Max streak tracked for achievement</li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-600 text-sm mb-2">Benefits of ranking:</p>
          <ul className="text-sm space-y-1 text-slate-700">
            <li>Recognition and visibility</li>
            <li>Performance bonuses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
