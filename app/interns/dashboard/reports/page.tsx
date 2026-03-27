"use client";

import React, { useEffect, useState } from "react";

interface Report {
  id: string;
  category: string;
  title: string;
  status: string;
  priority: string;
  created_by_name: string;
  created_by_email?: string;
  assigned_to_emails?: string[];
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
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-slate-100 text-slate-700",
    resolved: "bg-blue-100 text-blue-800",
    closed: "bg-slate-100 text-slate-600",
  };

  const priorityColors: Record<string, string> = {
    low: "text-slate-500",
    medium: "text-slate-700",
    high: "text-blue-700",
    critical: "text-blue-800",
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports</h1>
          <p className="text-slate-600">Bug reports and feature requests</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
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
                ? "bg-blue-700 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
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
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                  <p className="text-slate-600 text-sm">{report.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status || "open"] || "bg-slate-100 text-slate-700"}`}>
                    {(report.status || "open").replace("_", " ")}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[report.priority]}`}>
                    {report.priority}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-600 mt-2">
                <p>Raised by: {report.created_by_name || report.created_by_email || "Unknown"}</p>
                <p>Working on: {report.assigned_to_emails?.length ? report.assigned_to_emails.join(", ") : "Unassigned"}</p>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600 mt-4">
                <span>by {report.created_by_name}</span>
                <span className="text-slate-500">Report ID: {report.id.slice(0, 8)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No reports yet</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {reports.length > 0 && (
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
