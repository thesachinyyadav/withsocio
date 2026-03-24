"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLog {
  id: string;
  log_date: string;
  title: string;
  description: string;
  progress_status: string;
  created_by_name: string;
  created_at: string;
}

export default function WorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchWorkLogs();
  }, [page]);

  const fetchWorkLogs = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/work-logs?page=${page}&limit=10`, {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch work logs");

      const data = await response.json();
      setLogs(data.data || []);
    } catch (err) {
      setError("Failed to load work logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    submitted: "bg-blue-500/20 text-blue-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    blocked: "bg-rose-500/20 text-rose-400",
    reviewed: "bg-purple-500/20 text-purple-400",
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Work Logs</h1>
          <p className="text-slate-400">Track your daily work and progress</p>
        </div>
        <Link href="/interns/dashboard/work-logs/new">
          <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition">
            New Log
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Work Logs List */}
      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{log.title}</h3>
                  <p className="text-slate-400 text-sm">{log.log_date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[log.progress_status] || "bg-slate-700 text-slate-300"}`}>
                  {log.progress_status.replace("_", " ")}
                </span>
              </div>
              <p className="text-slate-300 mb-4 line-clamp-2">{log.description}</p>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>by {log.created_by_name}</span>
                <Link href={`/interns/dashboard/work-logs/${log.id}`}>
                  <button className="text-emerald-400 hover:text-emerald-300 transition">
                    View Details →
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
            <p className="text-slate-400 mb-4">No work logs yet</p>
            <Link href="/interns/dashboard/work-logs/new">
              <button className="text-emerald-400 hover:text-emerald-300 transition">
                Create your first work log →
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
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
