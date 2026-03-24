"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  created_by_name?: string;
  created_by_email?: string;
  assigned_to_emails?: string[];
}

export default function InternReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [viewerEmail, setViewerEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("interns_user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      setViewerEmail((parsedUser?.email || "").toLowerCase());
    } catch {
      setViewerEmail("");
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [page]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/reports?page=${page}&limit=10`, {
        headers: { "x-interns-token": token || "" },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
        setTotalPages(data?.pagination?.pages || 1);
        setTotalReports(data?.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (reportId: string) => {
    try {
      setClaimingId(reportId);
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify({ claimOwnership: true }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Could not claim report");
      }

      await fetchReports();
    } catch (error) {
      console.error("Claim failed:", error);
      alert("Could not claim this report right now.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleStatusChange = async (reportId: string, nextStatus: string) => {
    try {
      setUpdatingStatusId(reportId);
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Could not update status");
      }

      await fetchReports();
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Claim this report first, then update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-slate-100 text-slate-700",
    resolved: "bg-blue-200 text-blue-900",
    closed: "bg-slate-100 text-slate-700",
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredReports = reports.filter((report: Report) => {
    if (!normalizedSearch) return true;

    const searchable = [
      report.title,
      report.category,
      report.created_by_name || "",
      report.created_by_email || "",
      ...(report.assigned_to_emails || []),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports Board</h1>
          <p className="text-slate-600">See all reports, current owner, and status</p>
        </div>
        <Link href="/interns/workspace/reports/new">
          <button className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg transition">
            New Report
          </button>
        </Link>
      </div>

      <div className="mb-4 text-sm text-slate-600">Total reports: {totalReports}</div>

      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          placeholder="Search by user, email, or problem title/category"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
        />
        <p className="mt-1 text-xs text-slate-500">
          Showing {filteredReports.length} of {reports.length} reports on this page
        </p>
      </div>

      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report: Report) => {
            const isOwner =
              report.assigned_to_emails?.some(
                (email) => email.toLowerCase() === viewerEmail
              ) || false;

            return (
            <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                  <p className="text-slate-600 text-sm">{report.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status || "open"]}`}>
                  {(report.status || "open").replace("_", " ")}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <p>Raised by: {report.created_by_name || report.created_by_email || "Unknown"}</p>
                <p>Working on: {report.assigned_to_emails?.length ? report.assigned_to_emails.join(", ") : "Unassigned"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between text-sm text-slate-600 mt-4 gap-3">
                <span>Priority: {report.priority}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={report.status || "open"}
                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    disabled={!isOwner || updatingStatusId === report.id}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                  {report.status !== "resolved" && report.status !== "closed" &&
                    !isOwner && (
                      <button
                        onClick={() => handleClaim(report.id)}
                        disabled={claimingId === report.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 disabled:bg-blue-500 text-white text-xs font-semibold transition"
                      >
                        {claimingId === report.id ? "Claiming..." : "I’m working on this"}
                      </button>
                    )}
                  <span className="text-slate-500">Report ID: {report.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          )})
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            {searchQuery.trim() ? (
              <p className="text-slate-600">No reports match your search</p>
            ) : (
              <>
                <p className="text-slate-600 mb-4">No reports yet</p>
                <Link href="/interns/workspace/reports/new">
                  <button className="text-blue-800 hover:text-blue-900 transition">
                    Submit your first report
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
