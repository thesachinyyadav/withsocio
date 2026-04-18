"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendEmailPage() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleAddRecipient = (email: string) => {
    if (email && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content || recipients.length === 0) {
      setError("Please fill in all fields and add recipients");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("interns_token");
      const response = await fetch("/api/interns/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-interns-token": token || "",
        },
        body: JSON.stringify({
          recipientEmails: recipients,
          subject,
          htmlContent: content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send email");
        return;
      }

      setSuccess(`Email sent to ${data.summary.successCount} recipients`);
      setSubject("");
      setContent("");
      setRecipients([]);

      setTimeout(() => router.push("/socio/interns/dashboard"), 2000);
    } catch (err) {
      setError("Failed to send email");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Send Email</h1>
        <p className="text-slate-600">Communicate with interns</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-6">
        {/* Recipients */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Recipients</label>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Add recipient email"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;
                  handleAddRecipient(target.value);
                  target.value = "";
                }
              }}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="opacity-70 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        {/* Subject */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Email message (HTML supported)"
            rows={10}
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition"
        >
          {loading ? "Sending..." : "Send Email"}
        </button>
      </form>
    </div>
  );
}
