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
  const [selectedDate, setSelectedDate] = useState("all");

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/work-logs?page=1&limit=200`, {
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

  const uniqueDates: string[] = Array.from(
    new Set<string>(logs.map((log: WorkLog) => log.log_date))
  ).sort(
    (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()
  );

  const filteredLogs =
    selectedDate === "all"
      ? logs
      : logs.filter((log: WorkLog) => log.log_date === selectedDate);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Work Logs</h1>
          <p className="text-slate-600">Look at your entries and add your entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/interns/workspace/work-logs/all"
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition text-sm"
          >
            View All WorkLogs
          </Link>
          <Link href="/interns/workspace/work-logs/new">
            <button className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition">
              New Log
            </button>
          </Link>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label htmlFor="worklog-date" className="text-sm font-medium text-slate-700">
          Date
        </label>
        <select
          id="worklog-date"
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedDate(e.target.value)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">All dates</option>
          {uniqueDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.8fr_auto] gap-3 items-center">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{log.title}</h3>
                  <p className="text-slate-600 text-xs truncate">{log.description}</p>
                </div>
                <p className="text-xs text-slate-600">{log.log_date}</p>
                <p className="text-xs text-slate-600">{log.total_hours ? `${log.total_hours}h` : "--"}</p>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold text-center">
                  {log.progress_status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Log ID: {log.id.slice(0, 8)}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No work logs for selected date</p>
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
