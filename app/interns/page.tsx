"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InternsRootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("interns_token");
    const role = localStorage.getItem("interns_role");

    if (!token) {
      router.replace("/interns/login");
      return;
    }

    if (role === "admin") {
      router.replace("/interns/dashboard");
      return;
    }

    router.replace("/interns/workspace");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading SOCIO Workspace...</p>
      </div>
    </div>
  );
}
