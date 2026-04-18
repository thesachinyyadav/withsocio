"use client";

import React, { useEffect, useState } from "react";

interface WorkLogEntry {
  id: string;
  title: string;
  log_date: string;
  progress_status?: string;
}

interface ReportEntry {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("Intern");
  const [viewerEmail, setViewerEmail] = useState("");
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRaw = localStorage.getItem("interns_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const email = (user?.email || "").toLowerCase();
    const name = (user?.fullName || "Intern").trim();
    setViewerEmail(email);
    setDisplayName(name || "Intern");

    fetchProfileData(email);
  }, []);

  const fetchProfileData = async (email: string) => {
    try {
      const token = localStorage.getItem("interns_token");
      const [logsResponse, reportsResponse] = await Promise.all([
        fetch("/api/interns/work-logs?page=1&limit=400", {
          headers: { "x-interns-token": token || "" },
        }),
        fetch(`/api/interns/reports?page=1&limit=200&email=${encodeURIComponent(email)}`, {
          headers: { "x-interns-token": token || "" },
        }),
      ]);

      const logsPayload = await logsResponse.json().catch(() => ({}));
      const reportsPayload = await reportsResponse.json().catch(() => ({}));

      setWorkLogs(Array.isArray(logsPayload?.data) ? logsPayload.data : []);
      setReports(Array.isArray(reportsPayload?.data) ? reportsPayload.data : []);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDayOfMonth.getDay();

  const loggedDaySet = new Set(
    workLogs
      .map((log) => new Date(log.log_date))
      .filter((date) => date.getFullYear() === year && date.getMonth() === month)
      .map((date) => date.getDate())
  );

  const openCount = reports.filter((report) => report.status === "open").length;
  const inProgressCount = reports.filter((report) => report.status === "in_progress").length;
  const resolvedCount = reports.filter((report) => report.status === "resolved").length;

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const calendarCells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `empty-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-600">{displayName} • {viewerEmail || "No email found"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Work Logs</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{workLogs.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Days Logged (This Month)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{loggedDaySet.size}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Reports Raised</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{reports.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-100 p-5 shadow-sm">
          <p className="text-sm text-blue-800">Open + In Progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{openCount + inProgressCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Worklog Calendar</h2>
          <p className="mb-4 text-sm text-slate-600">Highlighted days indicate you logged work this month.</p>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => (
              <div
                key={cell.key}
                className={`h-10 rounded-lg border text-sm flex items-center justify-center ${
                  cell.day === null
                    ? 'border-transparent bg-transparent'
                    : loggedDaySet.has(cell.day)
                      ? 'border-blue-300 bg-blue-100 font-semibold text-blue-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {cell.day ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">My Report Status</h2>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Open: {openCount}</div>
            <div className="rounded-lg bg-blue-100 px-3 py-2 text-blue-900">In Progress: {inProgressCount}</div>
            <div className="rounded-lg bg-blue-200 px-3 py-2 text-blue-900">Resolved: {resolvedCount}</div>
          </div>

          {recentReports.length ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{report.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                    <span className="capitalize">{report.status?.replace("_", " ") || "open"}</span>
                    <span className="capitalize">{report.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No reports raised yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
