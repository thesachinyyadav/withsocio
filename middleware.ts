import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

const ALLOWED_PREFIXES = [
  "/socio/mail",
  "/socio/careers",
  "/socio/interns",
  "/socio/admin",
  "/socio/accounts",
  "/socio/panel",
  "/api/apply",
  "/api/admin",
  "/api/interns",
  "/api/accounts",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/withsocio.svg",
  "/socio.svg",
  "/robots.txt",
  "/sitemap.xml",
];

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  if (isAllowedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return new NextResponse("Site Unavailable", {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const config = {
  matcher: "/:path*",
};
