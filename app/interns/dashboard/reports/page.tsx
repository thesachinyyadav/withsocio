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
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [page, filterStatus]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      let url = `/api/interns/reports?page=${page}&limit=10`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

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

  const updateReportStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const token = localStorage.getItem("interns_token");
      const res = await fetch(`/api/interns/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      setReports((prev: Report[]) =>
        prev.map((r: Report) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update report status.");
    } finally {
      setUpdatingId(null);
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

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search reports by title, category, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchReports(); } }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setPage(1); fetchReports(); }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition whitespace-nowrap"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
          {["", "open", "in_progress", "resolved", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filterStatus === status
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {status ? status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "All Reports"}
            </button>
          ))}
        </div>
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
              <div className="flex justify-between items-center text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
                <span>by {report.created_by_name}</span>
                <span className="text-slate-500">Report ID: {report.id.slice(0, 8)}</span>
              </div>
              
              {report.status === "resolved" && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => updateReportStatus(report.id, "closed")}
                    disabled={updatingId === report.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updatingId === report.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    Approve (Close)
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, "in_progress")}
                    disabled={updatingId === report.id}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updatingId === report.id ? (
                      <div className="w-4 h-4 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    Revoke to Progress
                  </button>
                </div>
              )}
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
