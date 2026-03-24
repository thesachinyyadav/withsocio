import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const ADMIN_IDENTIFIER = "socio2026";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const WORK_LOG_STATUSES = [
  "submitted",
  "in_progress",
  "completed",
  "blocked",
  "reviewed",
] as const;

export const REPORT_CATEGORIES = ["feature", "bug", "issue", "problem"] as const;
export const REPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const REPORT_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type InternsRole = "admin" | "intern";

interface HiredInternRecord {
  id: string;
  full_name: string;
  email: string;
  status: "hired";
}

type ResolveIdentifierResult =
  | {
      ok: true;
      role: "admin";
      identifier: string;
    }
  | {
      ok: true;
      role: "intern";
      identifier: string;
      intern: HiredInternRecord;
    }
  | {
      ok: false;
      message: string;
      status: number;
    };

export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function parsePage(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { safePage, safeLimit, from, to };
}

export function toSafeSearch(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${str}"`;
}

export async function resolveIdentifier(identifier: string): Promise<ResolveIdentifierResult> {
  const normalized = normalizeIdentifier(identifier);

  if (!normalized) {
    return { ok: false, message: "Missing identifier", status: 400 };
  }

  if (normalized === ADMIN_IDENTIFIER) {
    return {
      ok: true,
      role: "admin",
      identifier: ADMIN_IDENTIFIER,
    };
  }

  if (!isValidEmail(normalized)) {
    return { ok: false, message: "Please enter a valid email or username.", status: 400 };
  }

  const { data, error } = await supabaseAdmin
    .from("internship_applications")
    .select("id, full_name, email, status")
    .ilike("email", normalized)
    .eq("status", "hired")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message, status: 500 };
  }

  if (!data) {
    return {
      ok: false,
      message: "Only hired interns can access this workspace.",
      status: 403,
    };
  }

  return {
    ok: true,
    role: "intern",
    identifier: normalized,
    intern: {
      id: data.id,
      full_name: data.full_name,
      email: normalizeIdentifier(data.email),
      status: "hired",
    },
  };
}

type AuthResult =
  | {
      ok: true;
      role: InternsRole;
      identifier: string;
      intern?: HiredInternRecord;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function authenticateRequest(
  request: Request,
  requiredRole?: InternsRole
): Promise<AuthResult> {
  const token = normalizeIdentifier(request.headers.get("x-interns-token") || "");

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing x-interns-token" }, { status: 401 }),
    };
  }

  const resolved = await resolveIdentifier(token);
  if (!resolved.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: resolved.message }, { status: resolved.status }),
    };
  }

  if (requiredRole && resolved.role !== requiredRole) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (resolved.role === "admin") {
    return {
      ok: true,
      role: "admin",
      identifier: ADMIN_IDENTIFIER,
    };
  }

  return {
    ok: true,
    role: "intern",
    identifier: resolved.identifier,
    intern: resolved.intern,
  };
}

export async function createAuditLog(input: {
  actor: string;
  action: string;
  targetType: "work_log" | "report";
  targetId: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  notes?: string | null;
}) {
  await supabaseAdmin.from("intern_admin_audit").insert({
    actor: input.actor,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    old_status: input.oldStatus || null,
    new_status: input.newStatus || null,
    notes: input.notes || null,
  });
}
