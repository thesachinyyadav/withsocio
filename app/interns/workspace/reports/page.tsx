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
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-slate-100 text-slate-700",
    resolved: "bg-blue-100 text-blue-800",
    closed: "bg-slate-100 text-slate-700",
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Reports</h1>
          <p className="text-slate-600">Track your submitted reports</p>
        </div>
        <Link href="/interns/workspace/reports/new">
          <button className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition">
            New Report
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map((report) => (
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
              <div className="flex items-center justify-between text-sm text-slate-600 mt-4">
                <span>Priority: {report.priority}</span>
                <span className="text-slate-500">Report ID: {report.id.slice(0, 8)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No reports yet</p>
            <Link href="/interns/workspace/reports/new">
              <button className="text-blue-700 hover:text-blue-800 transition">
                Submit your first report
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
