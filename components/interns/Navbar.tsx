"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface NavbarProps {
  user?: {
    email: string;
    fullName: string;
    role: "admin" | "intern";
  };
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("interns_token");
    localStorage.removeItem("interns_role");
    localStorage.removeItem("interns_user");
    router.push("/interns/login");
  };

  const navItems = isAdmin
    ? [
        { href: "/interns/dashboard", label: "Dashboard" },
        { href: "/interns/dashboard/reports", label: "Reports" },
        { href: "/interns/dashboard/work-logs", label: "Work Logs" },
        { href: "/interns/dashboard/interns", label: "Interns" },
      ]
    : [
        { href: "/interns/workspace", label: "Workspace" },
        { href: "/interns/workspace/work-logs", label: "Work Logs" },
        { href: "/interns/workspace/reports", label: "Reports" },
        { href: "/interns/workspace/leaderboard", label: "Leaderboard" },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-b border-slate-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/interns" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-bold">GATED</span>
            {isAdmin && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                Admin
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 text-sm">
              <div>
                <p className="text-white font-medium">{user?.fullName || "Admin"}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {showMenu && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
