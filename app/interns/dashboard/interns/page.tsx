"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Intern {
  id: string;
  fullName: string;
  email: string;
  roleInterest: string;
  portfolio: string;
  hoursPerWeek: number;
  points: number;
  streak: number;
  logsSubmitted: number;
  reportsSubmitted: number;
  joinedAt: string;
}

export default function InternsPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"points" | "streak" | "joined">( "points");

  useEffect(() => {
    fetchInterns();
  }, [page, sortBy]);

  const fetchInterns = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/admin/hired-people?page=${page}&limit=20`, {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch interns");

      const data = await response.json();
      let sorted = data.data || [];

      if (sortBy === "streak") {
        sorted.sort((a: Intern, b: Intern) => b.streak - a.streak);
      } else if (sortBy === "joined") {
        sorted.sort((a: Intern, b: Intern) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        );
      } else {
        sorted.sort((a: Intern, b: Intern) => b.points - a.points);
      }

      setInterns(sorted);
    } catch (err) {
      setError("Failed to load interns");
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Hired Interns</h1>
        <p className="text-slate-400">Manage and monitor interns</p>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Sort Options */}
      <div className="mb-6 flex gap-2">
        {["points", "streak", "joined"].map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === option
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {option === "points" && "Top Points"}
            {option === "streak" && "Streaks"}
            {option === "joined" && "Recently Joined"}
          </button>
        ))}
      </div>

      {/* Interns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interns.length > 0 ? (
          interns.map((intern) => (
            <div
              key={intern.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{intern.fullName}</h3>
                <p className="text-slate-400 text-sm">{intern.email}</p>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Role Interest:</span>
                  <span className="text-white">{intern.roleInterest}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Hours/Week:</span>
                  <span className="text-white">{intern.hoursPerWeek}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs font-semibold">POINTS</p>
                  <p className="text-emerald-400 text-2xl font-bold">{intern.points}</p>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-orange-400 text-xs font-semibold">STREAK</p>
                  <p className="text-orange-400 text-2xl font-bold">{intern.streak} 🔥</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-400 text-xs font-semibold">LOGS</p>
                  <p className="text-blue-400 text-2xl font-bold">{intern.logsSubmitted}</p>
                </div>
                <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg p-3">
                  <p className="text-rose-400 text-xs font-semibold">REPORTS</p>
                  <p className="text-rose-400 text-2xl font-bold">{intern.reportsSubmitted}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-slate-400">
                Joined {new Date(intern.joinedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
            <p className="text-slate-400">No interns found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {interns.length > 0 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-lg transition"
          >
            Previous
          </button>
          <span className="text-slate-300">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
