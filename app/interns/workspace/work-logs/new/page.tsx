"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWorkLogPage() {
  const [formData, setFormData] = useState({
    logDate: new Date().toISOString().split("T")[0],
    workMode: "onsite",
    title: "",
    description: "",
    collaboratorEmails: [] as string[],
    workStartTime: "",
    workEndTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch("/api/interns/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit work log");
        return;
      }

      router.push("/interns/workspace/work-logs");
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">New Work Log</h1>
        <p className="text-slate-600">Document your work and progress</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Date</label>
          <input
            type="date"
            value={formData.logDate}
            onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />

          <label className="block text-sm font-semibold text-slate-900 mt-4 mb-2">Work Mode</label>
          <select
            value={formData.workMode}
            onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
            required
          >
            <option value="onsite">Onsite</option>
            <option value="wfh">WFH</option>
          </select>
        </div>

        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Database optimization, API integration"
            maxLength={180}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <p className="text-xs text-slate-500 mt-2">{formData.title.length}/180 characters</p>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what you worked on, accomplishments, and any blockers..."
            maxLength={4000}
            rows={8}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600  "
            required
          />
          <p className="text-xs text-slate-500 mt-2">{formData.description.length}/4000 characters</p>
        </div>

        {/* Time Tracking */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-4">Work Hours (Optional)</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">End Time</label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition"
        >
          {loading ? "Submitting..." : "Submit Work Log"}
        </button>
      </form>
    </div>
  );
}
