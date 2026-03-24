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
    if (token) {
      verifyToken(token);
    } else if (!pathname.includes("/login")) {
      // Redirect to login if no token and not on login page
      router.push("/interns/login");
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/interns/admin/auth", {
        headers: {
          "x-interns-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("interns_token");
        if (!pathname.includes("/login")) {
          router.push("/interns/login");
        }
      }
    } catch (error) {
      localStorage.removeItem("interns_token");
      if (!pathname.includes("/login")) {
        router.push("/interns/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar user={user} />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
