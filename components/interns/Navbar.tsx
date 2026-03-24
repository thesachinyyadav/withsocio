"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
        {
          href: "/interns/dashboard",
          label: "Dashboard",
          description: "View overall internship analytics and admin insights",
        },
        {
          href: "/interns/dashboard/reports",
          label: "Reports",
          description: "Review and manage all reported issues and requests",
        },
        {
          href: "/interns/dashboard/work-logs",
          label: "Work Logs",
          description: "Monitor daily logs submitted by interns",
        },
        {
          href: "/interns/dashboard/interns",
          label: "Interns",
          description: "See hired interns and their participation details",
        },
      ]
    : [
        {
          href: "/interns/workspace",
          label: "Workspace",
          description: "Your home for latest updates, logs, and reports",
        },
        {
          href: "/interns/workspace/work-logs",
          label: "Work Logs",
          description: "Add and review your daily worklog entries",
        },
        {
          href: "/interns/workspace/reports",
          label: "Reports",
          description: "Raise new issues and track report status",
        },
        {
          href: "/interns/workspace/leaderboard",
          label: "Profile",
          description: "View your activity calendar and report progress",
        },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/interns" className="flex items-center space-x-2">
            <Image
              src="/socio.svg"
              alt="SOCIO logo"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <span className="text-slate-900 font-bold tracking-tight">Workplace</span>
            {isAdmin && (
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
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
                  title={item.description}
                  aria-label={`${item.label}: ${item.description}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-200 text-blue-800"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
                <p className="text-slate-900 font-medium">{user?.fullName || "Admin"}</p>
                <p className="text-slate-500 text-xs">{user?.email}</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition"
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
                  title={item.description}
                  aria-label={`${item.label}: ${item.description}`}
                  className={`block px-4 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-200 text-blue-800"
                      : "text-slate-700 hover:bg-slate-100"
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
