"use client";

import React, { useEffect, useState } from "react";

interface Intern {
  id: string;
  fullName: string;
  email: string;
  roleInterest: string;
  portfolio: string;
  hoursPerWeek: number;
  points: number;
  streak: number;
  logsSubmitted: number;
  reportsSubmitted: number;
  joinedAt: string;
}

export default function InternsPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"points" | "streak" | "joined">("points");
  const [selectedInternEmails, setSelectedInternEmails] = useState<string[]>([]);
  const [showMeetScheduler, setShowMeetScheduler] = useState(false);
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetError, setMeetError] = useState("");
  const [showMailAllModal, setShowMailAllModal] = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError, setMailError] = useState("");
  const [mailAllInterns, setMailAllInterns] = useState<Array<{ id: string; fullName: string; email: string }>>([]);
  const [selectedMailInterns, setSelectedMailInterns] = useState<string[]>([]);
  const [mailAllFetching, setMailAllFetching] = useState(false);
  const [mailForm, setMailForm] = useState({
    subject: "",
    message: "",
  });
  const [meetForm, setMeetForm] = useState({
    title: "Intern Weekly Sync",
    agenda: "Project updates and blockers",
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    durationMinutes: "30",
    founderInviteOption: "none",
  });

  useEffect(() => {
    fetchInterns();
  }, [page, sortBy]);

  const fetchInterns = async () => {
    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch(`/api/interns/admin/hired-people?page=${page}&limit=20`, {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch interns");

      const data = await response.json();
      let sorted = data.data || [];

      if (sortBy === "streak") {
        sorted.sort((a: Intern, b: Intern) => b.streak - a.streak);
      } else if (sortBy === "joined") {
        sorted.sort((a: Intern, b: Intern) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        );
      } else {
        sorted.sort((a: Intern, b: Intern) => b.points - a.points);
      }

      setInterns(sorted);
    } catch (err) {
      setError("Failed to load interns");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    const normalized = String(value).trim().toLowerCase();
    if (!normalized || normalized === "none" || normalized === "null" || normalized === "undefined") {
      return "-";
    }
    return String(value);
  };

  const toggleMeetIntern = (email: string) => {
    setSelectedInternEmails((current: string[]) => {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized) return current;
      if (current.includes(normalized)) {
        return current.filter((item: string) => item !== normalized);
      }
      return [...current, normalized];
    });
  };

  const handleScheduleMeet = async () => {
    setMeetError("");

    if (selectedInternEmails.length === 0) {
      setMeetError("Select at least one intern to schedule a meeting.");
      return;
    }

    if (!meetForm.title.trim()) {
      setMeetError("Meeting title is required.");
      return;
    }

    const startDateTime = new Date(`${meetForm.date}T${meetForm.time}:00`);
    if (Number.isNaN(startDateTime.getTime())) {
      setMeetError("Please provide a valid date and time.");
      return;
    }

    try {
      setMeetLoading(true);
      const token = localStorage.getItem("interns_token") || "";
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

      const response = await fetch("/api/interns/admin/schedule-meet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({
          recipientEmails: selectedInternEmails,
          title: meetForm.title,
          agenda: meetForm.agenda,
          meetingDate: meetForm.date,
          meetingTime: meetForm.time,
          startDateTimeIso: startDateTime.toISOString(),
          timezone,
          durationMinutes: Number(meetForm.durationMinutes),
          founderInviteOption: meetForm.founderInviteOption,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMeetError(payload?.error || "Failed to schedule GMeet.");
        return;
      }

      const link = payload?.data?.calendarLink;
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }

      alert("GMeet invite prepared and invitation emails sent.");
      setShowMeetScheduler(false);
      setSelectedInternEmails([]);
    } catch (err) {
      console.error(err);
      setMeetError("Could not schedule the meeting right now.");
    } finally {
      setMeetLoading(false);
    }
  };

  const openMeetScheduler = () => {
    setMeetError("");
    const allInternEmails = interns
      .map((intern: Intern) => String(intern.email || "").trim().toLowerCase())
      .filter(Boolean);
    setSelectedInternEmails(allInternEmails);
    setShowMeetScheduler(true);
  };

  const handleMailAllInterns = async () => {
    setMailError("");

    if (!mailForm.subject.trim()) {
      setMailError("Subject is required.");
      return;
    }

    if (!mailForm.message.trim()) {
      setMailError("Message is required.");
      return;
    }

    if (selectedMailInterns.length === 0) {
      setMailError("Select at least one intern to mail.");
      return;
    }

    try {
      setMailLoading(true);
      const token = localStorage.getItem("interns_token") || "";

      // Convert newlines to <br/> tags for HTML
      const htmlMessage = mailForm.message
        .split("\n")
        .map((line: string) => `<p>${line}</p>`)
        .join("");

      const response = await fetch("/api/interns/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({
          recipientEmails: selectedMailInterns,
          useSocioTemplate: true,
          subject: mailForm.subject,
          htmlContent: htmlMessage,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMailError(payload?.error || "Failed to send emails.");
        return;
      }

      const summary = payload?.summary;
      alert(
        `Email sent successfully!\nSent to: ${summary?.successCount}\nFailed: ${summary?.failCount}`
      );
      setShowMailAllModal(false);
      setMailForm({ subject: "", message: "" });
      setMailAllInterns([]);
      setSelectedMailInterns([]);
    } catch (err) {
      console.error(err);
      setMailError("Could not send emails right now.");
    } finally {
      setMailLoading(false);
    }
  };

  const openMailAllModal = async () => {
    setMailError("");
    setMailForm({ subject: "", message: "" });
    setShowMailAllModal(true);
    setMailAllFetching(true);

    try {
      const token = localStorage.getItem("interns_token") || "";
      const response = await fetch("/api/interns/admin/hired-people?limit=1000", {
        headers: { "x-interns-token": token || "" },
      });

      if (!response.ok) throw new Error("Failed to fetch interns");

      const data = await response.json();
      const interns = data.data || [];
      const internEmails = interns.map((i: Intern) => i.email?.toLowerCase()).filter(Boolean);

      setMailAllInterns(interns);
      setSelectedMailInterns(internEmails);
    } catch (err) {
      console.error(err);
      setMailError("Failed to load interns list");
    } finally {
      setMailAllFetching(false);
    }
  };

  const toggleMailIntern = (email: string) => {
    const normalized = String(email || "").toLowerCase();
    setSelectedMailInterns((current: string[]) => {
      if (current.includes(normalized)) {
        return current.filter((e: string) => e !== normalized);
      }
      return [...current, normalized];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hired Interns</h1>
        <p className="text-slate-600">Manage and monitor interns</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Sort + Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["points", "streak", "joined"].map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === option
                ? "bg-blue-700 text-white"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option === "points" && "Top Points"}
            {option === "streak" && "Streaks"}
            {option === "joined" && "Recently Joined"}
          </button>
        ))}

        <button
          onClick={openMeetScheduler}
          className="px-4 py-2 rounded-lg text-sm font-medium transition bg-blue-800 text-white hover:bg-blue-900"
        >
          Schedule Meeting
        </button>

        <button
          onClick={openMailAllModal}
          className="px-4 py-2 rounded-lg text-sm font-medium transition bg-green-700 text-white hover:bg-green-800"
        >
          Mail All Interns
        </button>
      </div>

      {showMeetScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Schedule GMeet</h2>
              <button
                onClick={() => setShowMeetScheduler(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Selected interns: <span className="font-semibold text-slate-900">{selectedInternEmails.length}</span>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Recipients ({selectedInternEmails.length} selected)
                </label>
                <div className="border border-slate-300 rounded-lg divide-y max-h-48 overflow-y-auto bg-slate-50">
                  {interns.length > 0 ? (
                    interns.map((intern) => {
                      const normalized = String(intern.email || "").toLowerCase();
                      const isSelected = selectedInternEmails.includes(normalized);

                      return (
                        <label
                          key={intern.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMeetIntern(intern.email)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-800"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{intern.fullName}</p>
                            <p className="text-xs text-slate-600">{intern.email}</p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-600 text-sm">No interns found</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Meeting Title</label>
                  <input
                    type="text"
                    value={meetForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMeetForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Agenda</label>
                  <input
                    type="text"
                    value={meetForm.agenda}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMeetForm((prev) => ({ ...prev, agenda: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={meetForm.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMeetForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Time</label>
                  <input
                    type="time"
                    value={meetForm.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMeetForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Duration (mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={meetForm.durationMinutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMeetForm((prev) => ({ ...prev, durationMinutes: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Also invite founders?</label>
                <select
                  value={meetForm.founderInviteOption}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setMeetForm((prev) => ({ ...prev, founderInviteOption: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                >
                  <option value="none">No</option>
                  <option value="both_founders">Yes - add both founders (surya.s + sachin.yadav)</option>
                  <option value="socio_mail">Yes - add thesocioblr@gmail.com</option>
                </select>
              </div>

              {meetError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {meetError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMeetScheduler(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeet}
                  disabled={meetLoading}
                  className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:bg-blue-500"
                >
                  {meetLoading ? "Scheduling..." : "Schedule & Send Invites"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMailAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white pb-4">
              <h2 className="text-lg font-bold text-slate-900">Mail All Interns</h2>
              <button
                onClick={() => setShowMailAllModal(false)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={mailForm.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMailForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Message</label>
                <textarea
                  placeholder="Type your message here. Use line breaks for paragraphs."
                  value={mailForm.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setMailForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Recipients: <span className="text-green-700 font-bold">{selectedMailInterns.length}</span> selected
                </label>
                {mailAllFetching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                  </div>
                ) : (
                  <div className="border border-slate-300 rounded-lg divide-y max-h-64 overflow-y-auto bg-slate-50">
                    {mailAllInterns.length > 0 ? (
                      mailAllInterns.map((intern) => {
                        const normalized = String(intern.email || "").toLowerCase();
                        const isSelected = selectedMailInterns.includes(normalized);
                        return (
                          <label
                            key={intern.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMailIntern(intern.email)}
                              className="h-4 w-4 rounded border-slate-300 text-green-700 focus:ring-green-600"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{intern.fullName}</p>
                              <p className="text-xs text-slate-600">{intern.email}</p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-600 text-sm">
                        No interns found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {mailError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {mailError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMailAllModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMailAllInterns}
                  disabled={mailLoading || selectedMailInterns.length === 0}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:bg-green-500"
                >
                  {mailLoading ? "Sending..." : `Send to ${selectedMailInterns.length} Interns`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interns.length > 0 ? (
          interns.map((intern) => (
            <div
              key={intern.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{intern.fullName}</h3>
                  <p className="text-slate-600 text-sm">{intern.email}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Role Interest:</span>
                  <span className="text-slate-900">{displayValue(intern.roleInterest)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hours/Week:</span>
                  <span className="text-slate-900">{displayValue(intern.hoursPerWeek)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-blue-700 text-xs font-semibold">POINTS</p>
                  <p className="text-blue-700 text-2xl font-bold">{intern.points}</p>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                  <p className="text-slate-700 text-xs font-semibold">STREAK</p>
                  <p className="text-slate-700 text-2xl font-bold">{intern.streak}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                  <p className="text-slate-700 text-xs font-semibold">LOGS</p>
                  <p className="text-slate-700 text-2xl font-bold">{intern.logsSubmitted}</p>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                  <p className="text-slate-700 text-xs font-semibold">REPORTS</p>
                  <p className="text-slate-700 text-2xl font-bold">{intern.reportsSubmitted}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-slate-500">
                Joined {new Date(intern.joinedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-600">No interns found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {interns.length > 0 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg transition"
          >
            Previous
          </button>
          <span className="text-slate-700">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
