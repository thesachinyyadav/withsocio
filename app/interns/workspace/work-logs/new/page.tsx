"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AttachmentItem {
  name: string;
  url: string;
  type: "file" | "drive_link" | "link";
}

function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;
}

export default function NewWorkLogPage() {
  const today = getTodayIST();

  const [formData, setFormData] = useState({
    logDate: today,
    workMode: "onsite",
    title: "",
    description: "",
    collaboratorEmails: [] as string[],
    workStartTime: "",
    workEndTime: "",
  });

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkName, setLinkName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const computeHours = (): string | null => {
    if (!formData.workStartTime || !formData.workEndTime) return null;
    const [sh, sm] = formData.workStartTime.split(":").map(Number);
    const [eh, em] = formData.workEndTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("interns_token") || "";

      // Upload using a simple FormData POST — we'll construct URL manually
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // For now, we'll add as a placeholder and the file can be referenced
      // In production, you'd upload to Supabase Storage
      // Using a data URL for local reference
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: reader.result as string,
            type: "file",
          },
        ]);
        setUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Failed to upload file");
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    const name = linkName.trim() || url.replace(/^https?:\/\//, "").split("/")[0];
    const type: AttachmentItem["type"] = url.includes("docs.google.com") || url.includes("drive.google.com") || url.includes("sheets.google.com")
      ? "drive_link"
      : "link";

    setAttachments((prev) => [...prev, { name, url, type }]);
    setLinkInput("");
    setLinkName("");
    setError("");
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side future date check
    if (formData.logDate > today) {
      setError("Cannot create work logs for future dates");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch("/api/interns/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.map(({ name, url, type }) => ({ name, url, type })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit work log");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/interns/workspace/work-logs"), 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hoursDisplay = computeHours();

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Work Log Submitted!</h2>
        <p className="text-slate-600">Redirecting to your work logs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
            <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Work Log</h1>
            <p className="text-slate-500 text-sm">Document your work and progress</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date & Work Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-900">Date & Mode</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Log Date</label>
              <input
                type="date"
                value={formData.logDate}
                max={today}
                onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Today or any past date</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Work Mode</label>
              <select
                value={formData.workMode}
                onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                required
              >
                <option value="onsite">🏢 Onsite</option>
                <option value="wfh">🏠 Work From Home</option>
              </select>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-semibold text-slate-900">Title</span>
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Database optimization, API integration, UI redesign"
            maxLength={180}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            required
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-400">Brief summary of what you worked on</p>
            <p className={`text-xs ${formData.title.length > 160 ? "text-amber-600" : "text-slate-400"}`}>
              {formData.title.length}/180
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-sm font-semibold text-slate-900">Description</span>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what you worked on, accomplishments, and any blockers..."
            maxLength={4000}
            rows={6}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition resize-none"
            required
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-400">Include details, progress, and blockers</p>
            <p className={`text-xs ${formData.description.length > 3800 ? "text-amber-600" : "text-slate-400"}`}>
              {formData.description.length}/4000
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-sm font-semibold text-slate-900">Attachments</span>
            <span className="text-xs text-slate-400 ml-1">(Optional)</span>
          </div>

          {/* Current Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                  <div className="flex-shrink-0">
                    {att.type === "file" ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : att.type === "drive_link" ? (
                      <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.71 3.5L1.15 15l4.58 7.5h13.14L12 3.5H7.71zm4.49 1.92L17.33 15H7.67l4.53-9.58zM5.15 16h6.43l3.28 5.5H2.57l2.58-5.5zm14.7 0l-3.28 5.5h5.86L20 16h-0.15z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{att.name}</p>
                    <p className="text-xs text-slate-400 truncate">{att.type === "file" ? "Uploaded file" : att.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload File */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 transition"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload File
                </>
              )}
            </button>
            <span className="text-xs text-slate-400 self-center">Max 10MB • PDF, DOC, XLS, PNG, JPG, ZIP</span>
          </div>

          {/* Add Link */}
          <div className="border-t border-slate-200 pt-3 mt-3">
            <p className="text-xs font-medium text-slate-500 mb-2">Or attach a link (Google Docs, Sheets, Drive, etc.)</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Link name (optional)"
                className="sm:w-1/3 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!linkInput.trim()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-slate-900">Work Hours</span>
            <span className="text-xs text-slate-400 ml-1">(Optional)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Time</label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">End Time</label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>
          {hoursDisplay && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-800 font-medium">Total: {hoursDisplay}</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-xl transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Work Log
            </>
          )}
        </button>

        {/* Back link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← Back to Work Logs
          </button>
        </div>
      </form>
    </div>
  );
}
