"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Applicant {
  id: string;
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

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const roleColors: Record<string, string> = {
  "Frontend Development": "bg-purple-100 text-purple-800",
  "Database Handling": "bg-orange-100 text-orange-800",
  "Operations": "bg-cyan-100 text-cyan-800",
  "Content Writing": "bg-pink-100 text-pink-800",
  "Marketing": "bg-indigo-100 text-indigo-800",
};

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchApplicants = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("internship_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        alert("Failed to load applicants. Please try again.");
      } else {
        setApplicants(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplicants();
    }
  }, [isAuthenticated, fetchApplicants]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "socio2026") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const updateStatus = async (id: string, status: Applicant["status"]) => {
    const { error } = await supabase
      .from("internship_applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
    if (selectedApplicant?.id === id) {
      setSelectedApplicant((prev) => (prev ? { ...prev, status } : null));
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-[#154CB3] to-[#0a2d6b] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <Image
                src="/socio.svg"
                alt="SOCIO"
                width={140}
                height={42}
                className="mx-auto"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Enter password to access applicant data</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#154CB3] focus:border-transparent transition-all outline-none"
              />
            </div>
            {authError && (
              <p className="text-red-600 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#154CB3] hover:bg-[#0f3d8f] text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/socio.svg"
              alt="SOCIO"
              width={100}
              height={30}
            />
            <div className="border-l border-gray-300 pl-3">
              <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Internship Applications</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchApplicants}
              disabled={isLoading}
              className="text-sm text-[#154CB3] hover:text-[#0f3d8f] font-medium disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
            <span className="text-sm text-gray-600">
              Total: <span className="font-semibold">{applicants.length}</span> applicants
            </span>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name, email, or campus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154CB3] focus:border-transparent outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154CB3] focus:border-transparent outline-none bg-white"
            >
              <option value="">All Roles</option>
              <option value="Frontend Development">Frontend Development</option>
              <option value="Database Handling">Database Handling</option>
              <option value="Operations">Operations</option>
              <option value="Content Writing">Content Writing</option>
              <option value="Marketing">Marketing</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154CB3] focus:border-transparent outline-none bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Applicants List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-gray-700 mb-3">
              Applicants ({filteredApplicants.length})
            </h2>
            {filteredApplicants.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                No applicants found
              </div>
            ) : (
              filteredApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${
                    selectedApplicant?.id === applicant.id
                      ? "border-[#154CB3] shadow-md"
                      : "border-transparent hover:border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{applicant.full_name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        statusColors[applicant.status]
                      }`}
                    >
                      {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{applicant.course_year_dept}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        roleColors[applicant.role_interest] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {applicant.role_interest}
                    </span>
                    <span className="text-xs text-gray-500">
                      {applicant.campus_id.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Applicant Details */}
          <div className="lg:col-span-2">
            {selectedApplicant ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#154CB3] to-[#1e5fc9] p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedApplicant.full_name}</h2>
                      <p className="text-blue-100 mt-1">{selectedApplicant.course_year_dept}</p>
                      <p className="text-blue-200 text-sm mt-2">
                        Applied: {formatDate(selectedApplicant.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[selectedApplicant.status]
                        }`}
                      >
                        {selectedApplicant.status.charAt(0).toUpperCase() +
                          selectedApplicant.status.slice(1)}
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {selectedApplicant.campus_id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#154CB3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <a href={`mailto:${selectedApplicant.email}`} className="text-[#154CB3] font-medium text-sm hover:underline">
                          {selectedApplicant.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a href={`tel:${selectedApplicant.phone_number}`} className="text-gray-900 font-medium text-sm hover:underline">
                          {selectedApplicant.phone_number}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Role & Hours */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Role Interest</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleColors[selectedApplicant.role_interest] || "bg-gray-100 text-gray-800"}`}>
                        {selectedApplicant.role_interest}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Hours/Week</h4>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        {selectedApplicant.hours_per_week} hours
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedApplicant.portfolio_link && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Portfolio/LinkedIn</h4>
                        <a
                          href={selectedApplicant.portfolio_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#154CB3] text-sm hover:underline break-all"
                        >
                          {selectedApplicant.portfolio_link}
                        </a>
                      </div>
                    )}
                    {selectedApplicant.work_sample && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Work Sample</h4>
                        <a
                          href={selectedApplicant.work_sample}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#154CB3] text-sm hover:underline break-all"
                        >
                          {selectedApplicant.work_sample}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Skills & Tools</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedApplicant.existing_skills || "Not specified"}
                    </p>
                  </div>

                  {/* Why Consider */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Why should we consider you?</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedApplicant.why_consider}
                    </p>
                  </div>

                  {/* Project Experience */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Project/Experience</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedApplicant.project_experience}
                    </p>
                  </div>

                  {/* Startup Comfort */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Comfortable with startup environment?</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedApplicant.startup_comfort === "Yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {selectedApplicant.startup_comfort}
                    </span>
                  </div>

                  {/* Internship Goals */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">What do you want to gain?</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedApplicant.internship_goals}
                    </p>
                  </div>

                  {/* Resume */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Resume</h4>
                    <a
                      href={selectedApplicant.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#154CB3] text-white rounded-lg hover:bg-[#0f3d8f] transition-all text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {selectedApplicant.resume_file_name}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {(["pending", "reviewed", "shortlisted", "rejected"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(selectedApplicant.id, status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedApplicant.status === status
                              ? "ring-2 ring-offset-2 ring-[#154CB3]"
                              : ""
                          } ${statusColors[status]}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Applicant</h3>
                <p className="text-gray-500">Click on an applicant from the list to view their details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
