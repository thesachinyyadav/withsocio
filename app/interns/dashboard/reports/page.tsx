"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  id: string;
  category: string;
  title: string;
  status: string;
  priority: string;
  created_by_name: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    fetchReports();
  }, [page, filterStatus]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      let url = `/api/interns/reports?page=${page}&limit=10`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const response = await fetch(url, {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      setError("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-500/20 text-blue-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    resolved: "bg-emerald-500/20 text-emerald-400",
    closed: "bg-slate-500/20 text-slate-400",
  };

  const priorityColors: Record<string, string> = {
    low: "text-slate-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-rose-400",
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
          <h1 className="text-4xl font-bold text-white mb-2">Reports</h1>
          <p className="text-slate-400">Bug reports and feature requests</p>
        </div>
        <Link href="/interns/dashboard/reports/new">
          <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition">
            New Report
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["", "open", "in_progress", "resolved", "closed"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === status
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{report.title}</h3>
                  <p className="text-slate-400 text-sm">{report.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status] || "bg-slate-700 text-slate-300"}`}>
                    {report.status.replace("_", " ")}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[report.priority]}`}>
                    {report.priority}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-400 mt-4">
                <span>by {report.created_by_name}</span>
                <Link href={`/interns/dashboard/reports/${report.id}`}>
                  <button className="text-emerald-400 hover:text-emerald-300 transition">
                    View Details →
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
            <p className="text-slate-400 mb-4">No reports yet</p>
            <Link href="/interns/dashboard/reports/new">
              <button className="text-emerald-400 hover:text-emerald-300 transition">
                Submit your first report →
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {reports.length > 0 && (
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
