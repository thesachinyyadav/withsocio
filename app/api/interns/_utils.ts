import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// ==================== CONSTANTS ====================
export const ADMIN_IDENTIFIER = "socio2026";

export const WORK_LOG_STATUSES = [
  "submitted",
  "in_progress",
  "completed",
  "blocked",
  "reviewed",
] as const;

export const REPORT_CATEGORIES = ["bug", "problem"] as const;
export const REPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const REPORT_PRIORITIES = ["low", "medium", "high", "critical"] as const;

// ==================== TYPES ====================
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

// ==================== IDENTIFIER RESOLUTION ====================
// Simplified to direct intern lookup - admin access uses ADMIN_IDENTIFIER constant

export async function resolveIdentifier(identifier: string): Promise<ResolveIdentifierResult> {
  const normalized = normalizeIdentifier(identifier);

  if (!normalized) {
    return { ok: false, message: "Missing identifier", status: 400 };
  }

  // Check if admin identifier
  if (normalized === ADMIN_IDENTIFIER) {
    return {
      ok: true,
      role: "admin",
      identifier: ADMIN_IDENTIFIER,
    };
  }

  // Fall back to hired intern check
  if (!isValidEmail(normalized)) {
    return { ok: false, message: "Please enter a valid email.", status: 400 };
  }

  const { data: intern, error } = await supabaseAdmin
    .from("internship_applications")
    .select("id, full_name, email, status")
    .ilike("email", normalized)
    .eq("status", "hired")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message, status: 500 };
  }

  if (!intern) {
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
      id: intern.id,
      full_name: intern.full_name,
      email: normalizeIdentifier(intern.email),
      status: "hired",
    },
  };
}

// ==================== REQUEST AUTHENTICATION ====================

type AuthResult =
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
      identifier: resolved.identifier,
    };
  }

  return {
    ok: true,
    role: "intern",
    identifier: resolved.identifier,
    intern: resolved.intern,
  };
}

// ==================== AUDIT LOGGING ====================

export async function createAuditLog(input: {
  actorEmail: string;
  action: string;
  targetType: "work_log" | "report" | "assignment" | "email";
  targetId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  assignedToEmail?: string | null;
  notes?: string | null;
  ipAddress?: string;
}) {
  await supabaseAdmin.from("intern_admin_audit").insert({
    actor_email: input.actorEmail,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId || null,
    old_status: input.oldStatus || null,
    new_status: input.newStatus || null,
    assigned_to_email: input.assignedToEmail || null,
    notes: input.notes || null,
    ip_address: input.ipAddress || null,
  });
}

// ==================== GAMIFICATION ====================

/**
 * Award points to an intern
 */
export async function awardPoints(internEmail: string, points: number, reason: string) {
  const { data: gamification } = await supabaseAdmin
    .from("intern_gamification")
    .select("*")
    .eq("intern_email", internEmail)
    .maybeSingle();

  if (!gamification) {
    // Create new gamification record
    await supabaseAdmin.from("intern_gamification").insert({
      intern_email: internEmail,
      total_points: points,
      work_logs_submitted: reason.includes("work_log") ? 1 : 0,
      reports_resolved: reason.includes("report") ? 1 : 0,
      last_activity_date: new Date().toISOString().split("T")[0],
    });
  } else {
    // Update existing record
    const updates: any = {
      total_points: gamification.total_points + points,
      last_activity_date: new Date().toISOString().split("T")[0],
    };

    if (reason.includes("work_log")) {
      updates.work_logs_submitted = gamification.work_logs_submitted + 1;
    }
    if (reason.includes("report")) {
      updates.reports_resolved = gamification.reports_resolved + 1;
    }

    await supabaseAdmin
      .from("intern_gamification")
      .update(updates)
      .eq("intern_email", internEmail);
  }
}

/**
 * Update intern streak
 */
export async function updateStreak(internEmail: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: gamification } = await supabaseAdmin
    .from("intern_gamification")
    .select("*")
    .eq("intern_email", internEmail)
    .maybeSingle();

  if (!gamification) return;

  const lastActivity = gamification.last_activity_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = gamification.current_streak;
  if (lastActivity === yesterday) {
    newStreak = gamification.current_streak + 1;
  } else if (lastActivity !== today) {
    newStreak = 1;
  }

  const maxStreak = Math.max(newStreak, gamification.max_streak);

  await supabaseAdmin
    .from("intern_gamification")
    .update({
      current_streak: newStreak,
      max_streak: maxStreak,
    })
    .eq("intern_email", internEmail);
}

// ==================== EMAIL SENDING (RESEND) ====================

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  adminEmail: string;
  templateId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  if (!RESEND_API_KEY) {
    console.error("[EMAIL] RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  console.log(`[EMAIL] Preparing to send email to ${input.to} with subject: ${input.subject}`);

  try {
    const payload = {
      from: "interns@socio.tech",
      to: input.to,
      subject: input.subject,
      html: input.html,
    };

    console.log(`[EMAIL] Resend API request payload:`, { from: payload.from, to: payload.to, subject: payload.subject });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`[EMAIL] Resend API response status: ${response.status}`, data);

    // Log email
    const auditResult = await supabaseAdmin.from("intern_email_log").insert({
      recipient_email: input.to,
      subject: input.subject,
      template_id: input.templateId || null,
      sent_by_admin_email: input.adminEmail,
      resend_message_id: data.id || null,
      status: response.ok ? "sent" : "failed",
    });

    console.log(`[EMAIL] Audit log insert result:`, auditResult);

    if (response.ok) {
      const result = { success: true, messageId: data.id };
      console.log(`[EMAIL] Final result for ${input.to}:`, result);
      return result;
    } else {
      const result = { success: false, error: data };
      console.log(`[EMAIL] Final result for ${input.to}:`, result);
      return result;
    }
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${input.to}:`, error);
    return { success: false, error };
  }
}

// ==================== FILE HANDLING ====================

export async function uploadFileAttachment(
  file: File,
  targetType: "work_log" | "report"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const bucket = targetType === "work_log" ? "work-log-attachments" : "report-attachments";
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
