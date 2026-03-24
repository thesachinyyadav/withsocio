"use client";

import React, { useEffect, useState } from "react";

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
    submitted: "bg-blue-50 text-blue-700",
    in_progress: "bg-slate-100 text-slate-700",
    completed: "bg-blue-100 text-blue-800",
    blocked: "bg-slate-100 text-slate-700",
    reviewed: "bg-slate-100 text-slate-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Work Logs</h1>
          <p className="text-slate-600">Track daily work and progress</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Work Logs List */}
      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{log.title}</h3>
                  <p className="text-slate-600 text-sm">{log.log_date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[log.progress_status] || "bg-slate-100 text-slate-700"}`}>
                  {log.progress_status.replace("_", " ")}
                </span>
              </div>
              <p className="text-slate-700 mb-4 line-clamp-2">{log.description}</p>
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>by {log.created_by_name}</span>
                <span className="text-slate-500">Log ID: {log.id.slice(0, 8)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No work logs yet</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg transition"
          >
            Previous
          </button>
          <span className="text-slate-700">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
