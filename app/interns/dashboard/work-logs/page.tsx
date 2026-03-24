"use client";

import React, { useEffect, useState } from "react";

interface WorkLog {
  id: string;
  log_date: string;
  title: string;
  description: string;
  progress_status: string;
  created_by_name: string;
  created_at: string;
}

interface GroupedRow {
  date: string;
  byPerson: Record<string, WorkLog[]>;
}

export default function WorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/work-logs?page=1&limit=200`, {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch work logs");

      const data = await response.json();
      setLogs(data.data || []);
    } catch (err) {
      setError("Failed to load work logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const people: string[] = Array.from(
    new Set<string>(logs.map((log: WorkLog) => log.created_by_name || "Unknown"))
  ).sort((a: string, b: string) => a.localeCompare(b));

  const groupedMap = logs.reduce<Map<string, Record<string, WorkLog[]>>>(
    (map: Map<string, Record<string, WorkLog[]>>, log: WorkLog) => {
      const date = log.log_date;
      const person = log.created_by_name || "Unknown";
      if (!map.has(date)) {
        map.set(date, {});
      }
      const row = map.get(date)!;
      if (!row[person]) row[person] = [];
      row[person].push(log);
      return map;
    },
    new Map<string, Record<string, WorkLog[]>>()
  );

  const groupedEntries: [string, Record<string, WorkLog[]>][] = [];
  groupedMap.forEach((value: Record<string, WorkLog[]>, key: string) => {
    groupedEntries.push([key, value]);
  });

  const groupedRows: GroupedRow[] = groupedEntries
    .sort(
      (a: [string, Record<string, WorkLog[]>], b: [string, Record<string, WorkLog[]>]) =>
        new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
    .map(([date, byPerson]: [string, Record<string, WorkLog[]>]) => ({
      date,
      byPerson,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[130px]">
                  Date
                </th>
                {people.map((person) => (
                  <th
                    key={person}
                    className="border-b border-r last:border-r-0 border-slate-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[220px]"
                  >
                    {person}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((row) => (
                <tr key={row.date} className="align-top">
                  <td className="border-b border-r border-slate-200 px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {row.date}
                  </td>
                  {people.map((person) => {
                    const personLogs = row.byPerson[person] || [];
                    return (
                      <td
                        key={`${row.date}-${person}`}
                        className="border-b border-r last:border-r-0 border-slate-200 px-4 py-3 text-slate-700"
                      >
                        {personLogs.length ? (
                          <ol className="list-decimal list-inside space-y-1">
                            {personLogs.map((entry) => (
                              <li key={entry.id}>
                                <span className="font-medium text-slate-900">{entry.title}</span>
                                {entry.description ? `: ${entry.description}` : ""}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
