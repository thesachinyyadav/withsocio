"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Applicant {
  id: string;
  preference1: string;
  preference2: string;
  full_name: string;
  course_year_dept: string;
  phone_number: string;
  email: string;
  portfolio_link: string;
  role_interest: string;
  existing_skills: string;
  why_consider: string;
  project_experience: string;
  startup_comfort: string;
  work_sample: string;
  hours_per_week: string;
  internship_goals: string;
  resume_url: string;
  resume_file_name: string;
  campus_id: string;
  created_at: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected";
}

interface InterviewScore {
  id: string;
  applicant_id: string;
  interviewer: string;
  communication: number;
  technical_depth: number;
  problem_solving: number;
  culture_fit: number;
  ownership: number;
  total: number;
  created_at: string;
}

const statusColors = {
  pending: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  reviewed: "bg-sky-500/15 text-sky-200 border border-sky-500/30",
  shortlisted: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
};

const roleColors: Record<string, string> = {
  "Frontend Development": "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30",
  "Database Handling": "bg-orange-500/15 text-orange-200 border border-orange-500/30",
  "Operations": "bg-lime-500/15 text-lime-200 border border-lime-500/30",
  "Content Writing": "bg-pink-500/15 text-pink-200 border border-pink-500/30",
  "Marketing": "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30",
  "Digital Marketing": "bg-teal-500/15 text-teal-200 border border-teal-500/30",
  "Video Editing / Videographer": "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30",
};

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [interviewer, setInterviewer] = useState("Sachin");
  const [rubricScores, setRubricScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [interviewScores, setInterviewScores] = useState<InterviewScore[]>([]);
  const [isSavingScore, setIsSavingScore] = useState(false);

  const rubricLabels = [
    "Communication",
    "Technical Depth",
    "Problem Solving",
    "Culture Fit",
    "Ownership",
  ];

  const interviewerOptions = [
    "Sachin",
    "Surya",
    "Smitha",
    "Guest 1",
    "Guest 2",
  ];

  const totalScore = rubricScores.reduce((sum, value) => sum + value, 0);
  const averageScore = interviewScores.length
    ? Math.round(
        interviewScores.reduce((sum, score) => sum + (score.total || 0), 0) /
          interviewScores.length
      )
    : 0;

  const fetchApplicants = useCallback(async () => {
    if (!adminToken) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/applicants?page=${page}&limit=${pageSize}`, {
        headers: {
          "x-admin-password": adminToken,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || "Failed to load applicants.";
        alert(message);
        return;
      }

      const payload = await response.json();
      const data = payload?.data as Applicant[] | undefined;
      const total = payload?.pagination?.total as number | undefined;

      if (!data || data.length === 0) {
        console.log("No applicants found");
        setApplicants([]);
        setTotalApplicants(total || 0);
      } else {
        setApplicants(data);
        setTotalApplicants(total || 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load applicants. Please check console for details.");
    }
    setIsLoading(false);
  }, [adminToken, page, pageSize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplicants();
    }
  }, [isAuthenticated, fetchApplicants]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "socio2026") {
      setIsAuthenticated(true);
      setAdminToken(password);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const updateStatus = async (id: string, status: Applicant["status"]) => {
    const response = await fetch("/api/admin/applicants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminToken,
      },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload?.error || "Failed to update status.";
      alert(message);
      return;
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
    if (selectedApplicant?.id === id) {
      setSelectedApplicant((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const sendCandidateMail = async (type: "shortlisted" | "selected" | "rejected") => {
    if (!selectedApplicant) return;
    setIsSendingMail(true);
    try {
      const response = await fetch("/api/admin/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminToken,
        },
        body: JSON.stringify({
          type,
          email: selectedApplicant.email,
          fullName: selectedApplicant.full_name,
          roleInterest: selectedApplicant.role_interest,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || "Failed to send email.";
        alert(message);
        return;
      }

      const messages = {
        shortlisted: "Shortlist email sent.",
        selected: "Selection email sent.",
        rejected: "Rejection email sent respectfully."
      };
      alert(messages[type]);
    } catch (error) {
      alert("Failed to send email.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const downloadByPreference = async (preference: "SOCIO" | "MedBro") => {
    try {
      const response = await fetch(`/api/admin/export?preference=${preference}`, {
        headers: {
          "x-admin-password": adminToken,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || "Failed to download.";
        alert(message);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `applicants_${preference.toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download.");
    }
  };

  const fetchInterviewScores = useCallback(
    async (applicantId: string) => {
      if (!adminToken) return;
      try {
        const response = await fetch(`/api/admin/scores?applicantId=${applicantId}`, {
          headers: {
            "x-admin-password": adminToken,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error || "Failed to load interview scores.";
          alert(message);
          return;
        }

        const payload = await response.json();
        setInterviewScores(payload?.data || []);
      } catch (error) {
        alert("Failed to load interview scores.");
      }
    },
    [adminToken]
  );

  const saveInterviewScore = async () => {
    if (!selectedApplicant) return;
    if (!interviewer) return;
    setIsSavingScore(true);

    try {
      const response = await fetch("/api/admin/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminToken,
        },
        body: JSON.stringify({
          applicantId: selectedApplicant.id,
          interviewer,
          scores: {
            communication: rubricScores[0],
            technicalDepth: rubricScores[1],
            problemSolving: rubricScores[2],
            cultureFit: rubricScores[3],
            ownership: rubricScores[4],
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || "Failed to save score.";
        alert(message);
        return;
      }

      await fetchInterviewScores(selectedApplicant.id);
    } catch (error) {
      alert("Failed to save score.");
    } finally {
      setIsSavingScore(false);
    }
  };

  useEffect(() => {
    if (selectedApplicant) {
      fetchInterviewScores(selectedApplicant.id);
    } else {
      setInterviewScores([]);
    }
  }, [selectedApplicant, fetchInterviewScores]);

  const filteredApplicants = applicants.filter((app) => {
    const matchesRole = !filterRole || app.role_interest === filterRole;
    const matchesStatus = !filterStatus || app.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.campus_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(totalApplicants / pageSize));

  useEffect(() => {
    setPage(1);
  }, [filterRole, filterStatus, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b1118] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap');
          .font-display { font-family: "Fraunces", serif; }
          .font-ui { font-family: "Space Grotesk", sans-serif; }
          @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .animate-floaty { animation: floaty 6s ease-in-out infinite; }
        `}</style>

        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-20 w-[420px] h-[420px] bg-teal-500/20 rounded-full blur-[90px] animate-floaty" />
          <div className="absolute bottom-0 -right-20 w-[520px] h-[520px] bg-amber-400/10 rounded-full blur-[110px] animate-floaty" style={{ animationDelay: "1.5s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[28px] p-8 md:p-12 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <Image src="/socio.svg" alt="SOCIO" width={120} height={36} className="brightness-0 invert" />
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">ADMIN</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-tight mb-2">SOCIO Panel Access</h1>
            <p className="text-white/60 mb-8">Enter your credentials to manage internship applications.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50 font-semibold">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-2 w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all outline-none text-white placeholder:text-white/40 font-ui"
                />
              </div>
              {authError && (
                <p className="text-rose-200 text-sm font-semibold text-center">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1118] font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-amber-400/20"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1118] text-white relative overflow-hidden font-ui">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap');
        .font-display { font-family: "Fraunces", serif; }
        .font-ui { font-family: "Space Grotesk", sans-serif; }
        @keyframes glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        .animate-glow { animation: glow 6s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-cyan-500/20 rounded-full blur-[110px] animate-glow" />
        <div className="absolute top-1/2 -right-32 w-[520px] h-[520px] bg-amber-400/10 rounded-full blur-[120px] animate-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b1118]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-2xl px-4 py-2 border border-white/10">
              <Image src="/socio.svg" alt="SOCIO" width={100} height={30} className="brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-display text-2xl">Admin Dashboard</h1>
              <p className="text-xs text-white/50">Internship applications control room</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchApplicants}
              disabled={isLoading}
              className="text-sm px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-sm px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 hover:bg-rose-500/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 grid xl:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Metrics</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Total applicants</span>
                <span className="text-lg font-semibold">{totalApplicants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Filtered</span>
                <span className="text-lg font-semibold">{filteredApplicants.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Page</span>
                <span className="text-lg font-semibold">{page}/{totalPages}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Filters</p>
            <input
              type="text"
              placeholder="Search name, email, campus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-white placeholder:text-white/40"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-white"
            >
              <option value="">All Roles</option>
              <option value="Frontend Development">Frontend Development</option>
              <option value="Database Handling">Database Handling</option>
              <option value="Operations">Operations</option>
              <option value="Content Writing">Content Writing</option>
              <option value="Marketing">Marketing</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Video Editing / Videographer">Video Editing / Videographer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Exports</p>
            <button
              onClick={() => downloadByPreference("SOCIO")}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 text-sm"
            >
              Download SOCIO Applicants
            </button>
            <button
              onClick={() => downloadByPreference("MedBro")}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 text-sm"
            >
              Download MedBro Applicants
            </button>
          </div>
        </aside>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Applicants</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || isLoading}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
              {applicants.length === 0 && !isLoading ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                  <p className="text-white/60">No applicants yet</p>
                  <button onClick={fetchApplicants} disabled={isLoading} className="text-xs text-amber-300 mt-2">
                    {isLoading ? "Refreshing..." : "Try refreshing"}
                  </button>
                </div>
              ) : filteredApplicants.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center text-white/60">
                  No results matching filters
                </div>
              ) : (
                filteredApplicants.map((applicant) => (
                  <button
                    key={applicant.id}
                    onClick={() => setSelectedApplicant(applicant)}
                    className={`w-full text-left bg-white/5 border rounded-3xl p-4 transition-all hover:bg-white/10 ${
                      selectedApplicant?.id === applicant.id
                        ? "border-amber-400/50 shadow-lg shadow-amber-400/10"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-white">{applicant.full_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[applicant.status]}`}>
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">{applicant.course_year_dept}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${roleColors[applicant.role_interest] || "bg-white/10 text-white/70 border border-white/10"}`}>
                        {applicant.role_interest}
                      </span>
                      <span className="text-xs text-white/40">{applicant.campus_id.toUpperCase()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            {selectedApplicant ? (
              <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/10 to-transparent">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-3xl">{selectedApplicant.full_name}</h2>
                      <p className="text-white/60 mt-1">{selectedApplicant.course_year_dept}</p>
                      <p className="text-xs text-white/40 mt-2">Applied: {formatDate(selectedApplicant.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${statusColors[selectedApplicant.status]}`}>
                        {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm bg-white/10 border border-white/10">
                        {selectedApplicant.campus_id.toUpperCase()}
                      </span>
                      {interviewScores.length > 0 && (
                        <span className="px-3 py-1 rounded-full text-sm bg-amber-400/20 border border-amber-400/30 text-amber-200">
                          Avg Score: {averageScore}/50
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-white/50">First Preference</p>
                      <p className="font-semibold mt-1">{selectedApplicant.preference1}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-white/50">Second Preference</p>
                      <p className="font-semibold mt-1">{selectedApplicant.preference2}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm text-white/60">Interview Scorecard</h4>
                      <span className="text-sm text-white/80 font-semibold">Total: {totalScore}/50</span>
                    </div>
                    <div className="grid md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-white/60 mb-2">Interviewer</label>
                        <select
                          value={interviewer}
                          onChange={(e) => setInterviewer(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-white"
                        >
                          {interviewerOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      {rubricLabels.map((label, index) => (
                        <div key={label}>
                          <label className="block text-xs font-semibold text-white/60 mb-2">{label}</label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={rubricScores[index]}
                            onChange={(e) => {
                              const value = Number(e.target.value || 0);
                              setRubricScores((prev) =>
                                prev.map((score, idx) =>
                                  idx === index ? Math.min(10, Math.max(0, value)) : score
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={saveInterviewScore}
                        disabled={isSavingScore}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-[#0b1118] hover:bg-amber-300 disabled:opacity-60"
                      >
                        {isSavingScore ? "Saving..." : "Save Score"}
                      </button>
                      {interviewScores.length > 0 && (
                        <span className="text-sm text-white/70">
                          Average: <span className="font-semibold">{averageScore}/50</span>
                        </span>
                      )}
                    </div>
                    {interviewScores.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {interviewScores.map((score) => (
                          <div key={score.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm">
                            <span className="font-medium text-white/80">{score.interviewer}</span>
                            <span className="text-white/60">{score.total}/50</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-white/50">Email</p>
                      <a href={`mailto:${selectedApplicant.email}`} className="text-amber-200 font-medium text-sm break-all hover:underline">
                        {selectedApplicant.email}
                      </a>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-white/50">Phone</p>
                      <a href={`tel:${selectedApplicant.phone_number}`} className="text-white font-medium text-sm hover:underline">
                        {selectedApplicant.phone_number}
                      </a>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/50 mb-2">Role Interest</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${roleColors[selectedApplicant.role_interest] || "bg-white/10 text-white/70 border border-white/10"}`}>
                        {selectedApplicant.role_interest}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-2">Hours/Week</p>
                      <span className="inline-block px-3 py-1 rounded-full text-sm bg-white/10 border border-white/10 text-white/80">
                        {selectedApplicant.hours_per_week} hours
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedApplicant.portfolio_link && (
                      <div>
                        <p className="text-xs text-white/50 mb-1">Portfolio/LinkedIn</p>
                        <a
                          href={selectedApplicant.portfolio_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-200 text-sm hover:underline break-all"
                        >
                          {selectedApplicant.portfolio_link}
                        </a>
                      </div>
                    )}
                    {selectedApplicant.work_sample && (
                      <div>
                        <p className="text-xs text-white/50 mb-1">Work Sample</p>
                        <a
                          href={selectedApplicant.work_sample}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-200 text-sm hover:underline break-all"
                        >
                          {selectedApplicant.work_sample}
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">Skills & Tools</p>
                    <p className="text-white/80 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm">
                      {selectedApplicant.existing_skills || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">Why should we consider you?</p>
                    <p className="text-white/80 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm">
                      {selectedApplicant.why_consider}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">Project/Experience</p>
                    <p className="text-white/80 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm">
                      {selectedApplicant.project_experience}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">Comfortable with startup environment?</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedApplicant.startup_comfort === "Yes"
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-200"
                        : "bg-rose-500/20 border border-rose-500/30 text-rose-200"
                    }`}>
                      {selectedApplicant.startup_comfort}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">What do you want to gain?</p>
                    <p className="text-white/80 bg-white/5 border border-white/10 p-4 rounded-2xl text-sm">
                      {selectedApplicant.internship_goals}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-2">Resume</p>
                    <a
                      href={selectedApplicant.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-[#0b1118] rounded-xl hover:bg-amber-300 transition-all text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {selectedApplicant.resume_file_name}
                    </a>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <p className="text-xs text-white/50 mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {(["pending", "reviewed", "shortlisted", "rejected"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedApplicant.id, status)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedApplicant.status === status
                              ? "ring-2 ring-offset-2 ring-amber-400"
                              : ""
                          } ${statusColors[status]}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-6 mb-3">Send Email</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => sendCandidateMail("shortlisted")}
                        disabled={isSendingMail}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500/20 border border-sky-500/30 text-sky-200 hover:bg-sky-500/30 disabled:opacity-60"
                      >
                        {isSendingMail ? "Sending..." : "Send Shortlist Email"}
                      </button>
                      <button
                        onClick={() => sendCandidateMail("selected")}
                        disabled={isSendingMail}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-60"
                      >
                        {isSendingMail ? "Sending..." : "Send Selection Email"}
                      </button>
                      <button
                        onClick={() => sendCandidateMail("rejected")}
                        disabled={isSendingMail}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/20 border border-rose-500/30 text-rose-200 hover:bg-rose-500/30 disabled:opacity-60"
                      >
                        {isSendingMail ? "Sending..." : "Send Rejection Email"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-12 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-display mb-2">Select an Applicant</h3>
                <p className="text-white/60">Click an applicant on the left to view their profile and actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
