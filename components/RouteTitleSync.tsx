"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HOME_TITLE =
  "WSOCIO - Creative Agency | Video Production, Personal Branding & Web Development";

const TITLE_OVERRIDES: Record<string, string> = {
  "/mail": "SOCIO Mail",
  "/socio": "SOCIO",
  "/socio/admin": "SOCIO Admin Hub",
  "/socio/accounts": "SOCIO Accounts",
  "/socio/panel": "SOCIO Admin Panel",
  "/socio/interns": "SOCIO Interns",
  "/socio/interns/workspace": "Intern Workspace",
  "/socio/interns/dashboard": "Intern Dashboard",
};

const humanizeSegment = (segment: string): string => {
  const normalized = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim();
  if (!normalized) return "";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const buildTitleForPath = (pathname: string): string => {
  if (pathname === "/") {
    return HOME_TITLE;
  }

  const override = TITLE_OVERRIDES[pathname];
  if (override) {
    return `${override} | WSOCIO`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return HOME_TITLE;
  }

  const readable = segments
    .map(humanizeSegment)
    .filter(Boolean)
    .join(" / ");

  return readable ? `${readable} | WSOCIO` : HOME_TITLE;
};

export default function RouteTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    document.title = buildTitleForPath(pathname);
  }, [pathname]);

  return null;
}
