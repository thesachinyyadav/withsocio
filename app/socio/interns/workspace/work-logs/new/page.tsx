"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Attachment {
  url: string;
  name: string;
  type: "file" | "link";
  mimeType?: string;
  size?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: "uploading" | "done" | "error";
  error?: string;
}

export default function NewWorkLogPage() {
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [workMode, setWorkMode] = useState("onsite");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkError, setLinkError] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAlumni, setIsAlumni] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("interns_user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      setIsAlumni(String(parsedUser?.status || "").toLowerCase() === "alumni");
    } catch {
      setIsAlumni(false);
    }
  }, []);

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";

    const token = localStorage.getItem("interns_token") || "";

    for (const file of files) {
      const tempId = `${Date.now()}-${Math.random()}`;

      setUploadingFiles((prev) => [
        ...prev,
        { id: tempId, name: file.name, progress: "uploading" },
      ]);

      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/interns/work-logs/upload", {
          method: "POST",
          headers: { "x-interns-token": token },
          body: fd,
        });

        const payload = await res.json();

        if (!res.ok) {
          setUploadingFiles((prev) =>
            prev.map((u) =>
              u.id === tempId
                ? { ...u, progress: "error", error: payload.error || "Upload failed" }
                : u
            )
          );
          continue;
        }

        setAttachments((prev) => [...prev, payload.attachment]);
        setUploadingFiles((prev) => prev.filter((u) => u.id !== tempId));
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === tempId
              ? { ...u, progress: "error", error: "Network error during upload" }
              : u
          )
        );
      }
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearUploadError = (id: string) => {
    setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
  };

  // ── Link attachment ───────────────────────────────────────────────────────
  const handleAddLink = () => {
    setLinkError("");
    const rawUrl = linkInput.trim();
    if (!rawUrl) {
      setLinkError("URL is required");
      return;
    }
    try {
      new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    } catch {
      setLinkError("Please enter a valid URL");
      return;
    }

    const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const displayName = linkName.trim() || rawUrl;

    setAttachments((prev) => [
      ...prev,
      { url: normalizedUrl, name: displayName, type: "link" },
    ]);
    setLinkInput("");
    setLinkName("");
    setShowLinkForm(false);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingFiles.some((u) => u.progress === "uploading")) {
      setError("Please wait for all uploads to finish before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("interns_token") || "";

      const response = await fetch("/api/interns/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token,
        },
        body: JSON.stringify({
          logDate,
          workMode,
          title,
          description,
          workStartTime: workStartTime || undefined,
          workEndTime: workEndTime || undefined,
          attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit work log");
        return;
      }

      router.push("/socio/interns/workspace/work-logs");
    } catch (err) {
      setError("An error occurred while submitting. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveUploads = uploadingFiles.some((u) => u.progress === "uploading");
  const uploadErrors = uploadingFiles.filter((u) => u.progress === "error");

  if (isAlumni) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Read-Only Alumni Access</h1>
          <p className="mt-2 text-sm text-slate-700">
            Creating new work logs is disabled for alumni accounts.
          </p>
          <Link
            href="/socio/interns/workspace/work-logs"
            className="mt-5 inline-flex rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
          >
            Back to Work Logs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">New Work Log</h1>
        <p className="text-slate-600">Document your work and progress</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Work Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Work Mode</label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
              required
            >
              <option value="onsite">Onsite</option>
              <option value="wfh">WFH</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Database optimization, API integration"
            maxLength={180}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <p className="text-xs text-slate-500 mt-2">{title.length}/180 characters</p>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you worked on, accomplishments, and any blockers..."
            maxLength={4000}
            rows={8}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <p className="text-xs text-slate-500 mt-2">{description.length}/4000 characters</p>
        </div>

        {/* Work Hours */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-4">
            Work Hours <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-2">Start Time</label>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">End Time</label>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          {workStartTime && workEndTime && (() => {
            const [sh, sm] = workStartTime.split(":").map(Number);
            const [eh, em] = workEndTime.split(":").map(Number);
            const totalMin = (eh * 60 + em) - (sh * 60 + sm);
            if (totalMin > 0) {
              const h = Math.floor(totalMin / 60);
              const m = totalMin % 60;
              return (
                <p className="text-xs text-blue-700 font-medium mt-3">
                  Duration: {h > 0 ? `${h}h ` : ""}{m > 0 ? `${m}m` : ""}
                </p>
              );
            }
            return null;
          })()}
        </div>

        {/* Attachments */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Attachments <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">Files up to 10 MB each · Images, PDF, Word, CSV, ZIP supported</p>
            </div>
          </div>

          {/* Attached items list */}
          {attachments.length > 0 && (
            <ul className="space-y-2 mb-4">
              {attachments.map((att, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {att.type === "link" ? (
                      <svg className="h-4 w-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-slate-800 truncate">{att.name}</span>
                    {att.type === "link" && (
                      <span className="text-xs text-slate-400 truncate hidden sm:block">
                        {att.url}
                      </span>
                    )}
                    {att.size != null && (
                      <span className="text-xs text-slate-400 shrink-0">
                        {(att.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="shrink-0 text-slate-400 hover:text-red-500 transition"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Uploading indicators */}
          {uploadingFiles.filter((u) => u.progress === "uploading").map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 mb-2">
              <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-blue-700 truncate">Uploading {u.name}…</span>
            </div>
          ))}

          {/* Upload error indicators */}
          {uploadErrors.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700 truncate">{u.name}: {u.error}</span>
              </div>
              <button
                type="button"
                onClick={() => clearUploadError(u.id)}
                className="shrink-0 text-red-400 hover:text-red-600 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload File
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkForm((v) => !v); setLinkError(""); }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add Link
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,text/plain,text/csv,application/zip"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Link form */}
          {showLinkForm && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Add a link</p>
              <div>
                <label className="block text-xs text-slate-500 mb-1">URL *</label>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g., Design doc, PR #42"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {linkError && <p className="text-xs text-red-600">{linkError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLinkForm(false); setLinkInput(""); setLinkName(""); setLinkError(""); }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || hasActiveUploads}
          className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {loading
            ? "Submitting…"
            : hasActiveUploads
            ? "Waiting for uploads…"
            : "Submit Work Log"}
        </button>
      </form>
    </div>
  );
}
