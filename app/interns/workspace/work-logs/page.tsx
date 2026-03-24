"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLog {
  id: string;
  log_date: string;
  title: string;
  description: string;
  progress_status: string;
  total_hours: number | null;
  created_at: string;
}

export default function InternWorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
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

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch work logs:", err);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Work Logs</h1>
          <p className="text-slate-600">Track your submitted work</p>
        </div>
        <Link href="/interns/workspace/work-logs/new">
          <button className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition">
            New Log
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{log.title}</h3>
                  <p className="text-slate-600 text-sm">{log.log_date}</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  {log.progress_status.replace("_", " ")}
                </span>
              </div>
              <p className="text-slate-700 mb-4 line-clamp-2">{log.description}</p>
              {log.total_hours && (
                <p className="text-slate-600 text-sm mb-2">{log.total_hours} hours</p>
              )}
              <p className="text-slate-500 text-sm">Log ID: {log.id.slice(0, 8)}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No work logs yet</p>
            <Link href="/interns/workspace/work-logs/new">
              <button className="text-blue-700 hover:text-blue-800 transition">
                Create your first work log
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
