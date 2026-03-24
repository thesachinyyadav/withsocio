"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewReportPage() {
  const [formData, setFormData] = useState({
    category: "bug",
    title: "",
    details: "",
    priority: "medium",
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
      const response = await fetch("/api/interns/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit report");
        return;
      }

      router.push("/interns/workspace/reports");
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">New Report</h1>
        <p className="text-slate-600">Report bugs or workflow issues</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Category</label>
          <div className="space-y-2">
            {[
              { value: "bug", label: "Bug - Something is broken" },
              { value: "problem", label: "Problem - Workflow issue" },
            ].map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={formData.category === option.value}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mr-3"
                />
                <span className="text-slate-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief title of the issue"
            maxLength={180}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <p className="text-xs text-slate-500 mt-2">{formData.title.length}/180 characters</p>
        </div>

        {/* Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Details</label>
          <textarea
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            placeholder="Describe the issue, steps to reproduce, expected vs actual behavior..."
            maxLength={5000}
            rows={10}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <p className="text-xs text-slate-500 mt-2">{formData.details.length}/5000 characters</p>
        </div>

        {/* Priority */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="low">Low - Can wait</option>
            <option value="medium">Medium - Should be addressed</option>
            <option value="high">High - Urgent</option>
            <option value="critical">Critical - Blocks work</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
