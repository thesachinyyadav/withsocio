"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/interns/Navbar";

interface AuthUser {
  email: string;
  fullName: string;
  role: "admin" | "intern";
  id?: string;
}

const INTERNS_SESSION_STARTED_AT_KEY = "interns_session_started_at";
const INTERNS_SESSION_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

const clearInternsSession = () => {
  localStorage.removeItem("interns_token");
  localStorage.removeItem("interns_role");
  localStorage.removeItem("interns_user");
  localStorage.removeItem(INTERNS_SESSION_STARTED_AT_KEY);
};

const isSessionExpired = () => {
  const startedAtRaw = localStorage.getItem(INTERNS_SESSION_STARTED_AT_KEY);
  if (!startedAtRaw) return false;

  const startedAt = Number(startedAtRaw);
  if (!Number.isFinite(startedAt)) return true;

  return Date.now() - startedAt > INTERNS_SESSION_DURATION_MS;
};

export default function InternsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for existing session token
    const token = localStorage.getItem("interns_token");
    const role = localStorage.getItem("interns_role");

    if (token && isSessionExpired()) {
      clearInternsSession();
      if (!pathname.includes("/login")) {
        router.push("/interns/login");
      }
      setLoading(false);
      return;
    }
    
    if (token) {
      verifyToken(token, role);
    } else if (!pathname.includes("/login")) {
      // Redirect to login if no token and not on login page
      router.push("/interns/login");
    } else {
      setLoading(false);
    }
  }, [router, pathname]);

  const verifyToken = async (token: string, role?: string | null) => {
    try {
      const response = await fetch("/api/interns/auth", {
        headers: {
          "x-interns-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          role: (data.role || role || "intern") as "admin" | "intern",
          email: data?.user?.email || "",
          fullName: data?.user?.fullName || "SOCIO User",
          id: data?.user?.id,
        };
        if (!localStorage.getItem(INTERNS_SESSION_STARTED_AT_KEY)) {
          localStorage.setItem(INTERNS_SESSION_STARTED_AT_KEY, String(Date.now()));
        }
        setUser(userData);
        localStorage.setItem("interns_user", JSON.stringify(userData));
      } else {
        clearInternsSession();
        if (!pathname.includes("/login")) {
          router.push("/interns/login");
        }
      }
    } catch (error) {
      console.error("Token verification error:", error);
      const cachedUserRaw = localStorage.getItem("interns_user");
      if (cachedUserRaw) {
        try {
          setUser(JSON.parse(cachedUserRaw));
        } catch {
          if (!pathname.includes("/login")) {
            router.push("/interns/login");
          }
        }
      } else if (!pathname.includes("/login")) {
        router.push("/interns/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (pathname.includes("/login")) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar user={user} />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
