"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface WorkLog {
  id: string;
  log_date: string;
  work_mode?: string;
  title: string;
  description: string;
  created_by_name?: string;
  created_by_email?: string;
  progress_status: string;
  attachments?: Array<{ url: string; name: string; type: string }>;
}

interface GroupedRow {
  date: string;
  byPerson: Record<string, WorkLog[]>;
}

export default function AllWorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem("interns_token") || "";
        const response = await fetch(
          "/api/interns/work-logs?page=1&limit=300&includeAll=true",
          { headers: { "x-interns-token": token } }
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

  const groupedMap = logs.reduce((map, log) => {
    const date = log.log_date;
    const person = log.created_by_name || log.created_by_email || "Unknown";
    if (!map.has(date)) map.set(date, {});
    const dateBucket = map.get(date)!;
    if (!dateBucket[person]) dateBucket[person] = [];
    dateBucket[person].push(log);
    return map;
  }, new Map<string, Record<string, WorkLog[]>>());

  const groupedRows: GroupedRow[] = Array.from(groupedMap.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, byPerson]) => ({ date, byPerson }));

  const statusStyle: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-rose-100 text-rose-800",
    reviewed: "bg-purple-100 text-purple-800",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-700 mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading worklogs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Company WorkLogs</h1>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Everyone&apos;s entries categorized by date
          </p>
        </div>
        <Link
          href="/interns/workspace/work-logs"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          Back to My WorkLogs
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <p className="text-slate-600 font-medium">No worklogs available in the workspace right now.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedRows.map((row) => {
            const peopleInDate = Object.keys(row.byPerson).sort((a, b) => a.localeCompare(b));
            const totalItems = peopleInDate.reduce((sum, person) => sum + row.byPerson[person].length, 0);

            return (
              <section key={row.date} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Date Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {new Date(row.date + "T00:00:00").toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h2>
                      <p className="text-xs font-medium text-slate-500">{peopleInDate.length} {peopleInDate.length === 1 ? 'person' : 'people'} • {totalItems} entries</p>
                    </div>
                  </div>
                </div>

                {/* People Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 bg-slate-100/30">
                  {peopleInDate.map((person) => {
                    const personLogs = row.byPerson[person] || [];
                    return (
                      <article key={`${row.date}-${person}`} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                              {person.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{person}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600">
                            {personLogs.length} LOGS
                          </span>
                        </div>

                        <div className="space-y-3 p-4">
                          {personLogs.map((entry) => (
                            <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{entry.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {entry.work_mode && (
                                    <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                      {entry.work_mode}
                                    </span>
                                  )}
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${statusStyle[entry.progress_status || "submitted"] || "bg-slate-100 text-slate-700"}`}>
                                    {(entry.progress_status || 'submitted').replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                              {entry.description && (
                                <p className="text-[13px] leading-relaxed text-slate-600">{entry.description}</p>
                              )}
                              {entry.attachments && entry.attachments.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-200/80">
                                  {entry.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                                      title={att.name}
                                    >
                                      {att.type === "link" ? (
                                        <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                      ) : (
                                        <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                      )}
                                      <span className="max-w-[150px] truncate">{att.name}</span>
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
    </div>
  );
}
