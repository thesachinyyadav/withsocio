"use client";

import React, { useEffect, useState } from "react";

interface WorkLog {
  id: string;
  log_date: string;
  work_mode?: string;
  title: string;
  description: string;
  progress_status: string;
  created_by_name: string;
  created_at: string;
  attachments?: Array<{ url: string; name: string; type: "file" | "link" }>;
}

interface GroupedRow {
  date: string;
  byPerson: Record<string, WorkLog[]>;
}

export default function WorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWorkLogs();
  }, [page]);

  const fetchWorkLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/interns/work-logs?includeAll=true&page=${page}&limit=50`);

      if (!response.ok) {
        throw new Error("Failed to fetch work logs");
      }

      const payload = await response.json();
      setLogs(Array.isArray(payload.data) ? payload.data : []);
      setTotalPages(payload.pagination?.pages || 1);
    } catch (err) {
      setError("Failed to load work logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupedMap = logs.reduce((map: Map<string, Record<string, WorkLog[]>>, log: WorkLog) => {
    const date = log.log_date;
    const person = log.created_by_name || "Unknown";

    if (!map.has(date)) map.set(date, {});
    const dateBucket = map.get(date)!;
    if (!dateBucket[person]) dateBucket[person] = [];
    dateBucket[person].push(log);

    return map;
  }, new Map<string, Record<string, WorkLog[]>>());

  const groupedEntries: [string, Record<string, WorkLog[]>][] = [];
  groupedMap.forEach((value: Record<string, WorkLog[]>, key: string) => {
    groupedEntries.push([key, value]);
  });

  const groupedRows: GroupedRow[] = groupedEntries
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, byPerson]) => ({ date, byPerson }));

  const statusStyle: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    in_progress: "bg-slate-200 text-slate-700",
    completed: "bg-blue-200 text-blue-900",
    blocked: "bg-slate-200 text-slate-700",
    reviewed: "bg-blue-100 text-blue-900",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">WorkLog Page</h1>
          <p className="text-slate-600">Daily worklogs by person</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">Total entries loaded: <span className="font-semibold text-slate-900">{logs.length}</span></div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/interns/admin/export?kind=work-logs&format=xlsx"
              className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-200"
            >
              Export XLSX
            </a>
            <a
              href="/api/interns/admin/export?kind=work-logs&format=csv"
              className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-200"
            >
              Export CSV
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-600 mb-4">No work logs yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedRows.map((row) => {
            const peopleInDate = Object.keys(row.byPerson).sort((a, b) => a.localeCompare(b));
            const totalItems = peopleInDate.reduce((sum, person) => sum + row.byPerson[person].length, 0);

            return (
              <section key={row.date} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{row.date}</h2>
                    <p className="text-xs text-slate-600">{peopleInDate.length} people • {totalItems} entries</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
                  {peopleInDate.map((person) => {
                    const personLogs = row.byPerson[person] || [];
                    return (
                      <article key={`${row.date}-${person}`} className="rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <p className="font-semibold text-slate-900">{person}</p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {personLogs.length} {personLogs.length > 1 ? "logs" : "log"}
                          </span>
                        </div>

                        <div className="space-y-3 p-4">
                          {personLogs.map((entry) => (
                            <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 uppercase">
                                    {(entry.work_mode || "onsite")}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[entry.progress_status] || "bg-slate-100 text-slate-700"}`}
                                  >
                                    {entry.progress_status.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                              {entry.description && (
                                <p className="mt-1 text-xs text-slate-600">{entry.description}</p>
                              )}
                              
                              {entry.attachments && entry.attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {entry.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                                      title={att.name}
                                    >
                                      {att.type === "link" ? (
                                        <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                      ) : (
                                        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                      )}
                                      <span className="max-w-[120px] truncate">{att.name}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-8">
          <button
            onClick={() => { setPage((p: number) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => { setPage((p: number) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
