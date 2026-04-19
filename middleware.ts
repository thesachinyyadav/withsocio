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

function getCanonicalRedirect(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/mail" || pathname.startsWith("/mail/")) {
    const target = request.nextUrl.clone();
    target.pathname = "/socio/mail";
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  if (/^\/socio\/careers\/[^/]+\/mailbox(?:\/.*)?$/.test(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/socio/mail";
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  return null;
}

export function middleware(request: NextRequest) {
  const canonicalRedirect = getCanonicalRedirect(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

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
