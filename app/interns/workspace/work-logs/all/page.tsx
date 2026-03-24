"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLog {
  id: string;
  log_date: string;
  title: string;
  description: string;
  created_by_name?: string;
  created_by_email?: string;
  progress_status?: string;
}

export default function AllWorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem("interns_token") || "";
        const response = await fetch(
          "/api/interns/work-logs?page=1&limit=300&includeAll=true",
          {
            headers: { "x-interns-token": token },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch all worklogs");
        const payload = await response.json();
        setLogs(Array.isArray(payload?.data) ? payload.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-800" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All WorkLogs</h1>
          <p className="text-slate-600 text-sm">Everyone&apos;s entries with name, date, and work details.</p>
        </div>
        <Link
          href="/interns/workspace/work-logs"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to My WorkLogs
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No worklogs available.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-max min-w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[190px]">
                  Name
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[130px]">
                  Date
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[260px]">
                  Work
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[140px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-800">
                    {log.created_by_name || log.created_by_email || "Unknown"}
                  </td>
                  <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700 whitespace-nowrap">
                    {log.log_date}
                  </td>
                  <td className="border-b border-r border-slate-200 px-4 py-3 text-slate-700 break-words">
                    <p className="font-medium text-slate-900">{log.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{log.description}</p>
                  </td>
                  <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                    {log.progress_status || "submitted"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
