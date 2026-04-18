"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function InternsLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/interns/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store session
      localStorage.setItem("interns_token", data.token);
      localStorage.setItem("interns_role", data.role);
      localStorage.setItem("interns_user", JSON.stringify(data.user || null));

      if (data.role === "admin") {
        router.push("/socio/interns/dashboard");
      } else {
        router.push("/socio/interns/workspace");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/socio.svg"
              alt="SOCIO logo"
              width={88}
              height={88}
              className="h-20 w-20"
              priority
            />
          </div>
          <p className="text-blue-700 text-sm">Workspace Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Intern Login</h2>
          <div className="mb-6" />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition duration-200"
            >
              {loading ? "Signing in..." : "Enter Workspace"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-600">
            <a
              href="https://live.withsocio.com"
              target="_self"
              className="text-blue-700 hover:text-blue-800 transition mt-2 inline-block"
            >
              Back to SOCIO
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
