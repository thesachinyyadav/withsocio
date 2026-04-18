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
  attachments?: any[];
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
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
            href="/socio/interns/workspace/work-logs/all"
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition text-sm"
          >
            View All WorkLogs
          </Link>
          <Link href="/socio/interns/workspace/work-logs/new">
            <button className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg transition">
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-semibold text-center">
                  {log.progress_status.replace("_", " ")}
                </span>
              </div>
              
              {log.attachments && log.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {log.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {att.type === "link" ? (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                      <span className="truncate max-w-[150px]">{att.name}</span>
                    </a>
                  ))}
                </div>
              )}

              <p className="mt-2 text-[11px] text-slate-400">Log ID: {log.id.slice(0, 8)}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600 mb-4">No work logs for selected date</p>
            <Link href="/socio/interns/workspace/work-logs/new">
              <button className="text-blue-800 hover:text-blue-900 transition">
                Create your first work log
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
