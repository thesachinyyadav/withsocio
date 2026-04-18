import { NextResponse } from "next/server";
import {
  buildSocioEmailHtml,
  supabaseAdmin,
  toSafeSearch,
} from "../interns/_utils";

export const dynamic = "force-dynamic";

export const ACCOUNTS_USERS = ["sachin", "surya"] as const;
export const ACCOUNTS_STATUSES = ["pending_approval", "purchased", "settled"] as const;
export const DEFAULT_EXPENSE_NOTIFY_TO = "thesocio.blr@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_EMAIL =
  (process.env.RESEND_FROM_EMAIL || "").trim() || "SOCIO Accounts <accounts@withsocio.com>";

export type AccountsUser = (typeof ACCOUNTS_USERS)[number];
export type AccountsStatus = (typeof ACCOUNTS_STATUSES)[number];

export interface ReceiptAttachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
}

export function normalizeAccountsUser(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function isAccountsUser(value: string): value is AccountsUser {
  return ACCOUNTS_USERS.includes(value as AccountsUser);
}

export function resolveAccountsUser(value: unknown): AccountsUser | null {
  const normalized = normalizeAccountsUser(String(value || ""));
  return isAccountsUser(normalized) ? normalized : null;
}

export function authenticateAccountsUser(request: Request):
  | { ok: true; user: AccountsUser }
  | { ok: false; response: NextResponse } {
  const fromHeader = request.headers.get("x-accounts-user");
  const fromQuery = (() => {
    try {
      const { searchParams } = new URL(request.url);
      return searchParams.get("user");
    } catch {
      return null;
    }
  })();

  const user = resolveAccountsUser(fromHeader || fromQuery);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Unauthorized. Use a valid user (sachin or surya) via x-accounts-user header or ?user=...",
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, user };
}

export function parsePositiveNumber(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSplit(input: {
  totalAmount: number;
  sachinPercent: number;
  suryaPercent: number;
}):
  | {
      ok: true;
      result: {
        splitSachinPercent: number;
        splitSuryaPercent: number;
        splitSachinAmount: number;
        splitSuryaAmount: number;
      };
    }
  | { ok: false; error: string } {
  const totalAmount = roundTo2(input.totalAmount);
  const sachinPercent = roundTo2(input.sachinPercent);
  const suryaPercent = roundTo2(input.suryaPercent);

  if (totalAmount <= 0) {
    return { ok: false, error: "Total amount must be greater than 0." };
  }

  if (sachinPercent < 0 || sachinPercent > 100 || suryaPercent < 0 || suryaPercent > 100) {
    return { ok: false, error: "Split percentages must be between 0 and 100." };
  }

  const percentTotal = roundTo2(sachinPercent + suryaPercent);
  if (percentTotal !== 100) {
    return { ok: false, error: "Split percentages must add up to exactly 100." };
  }

  const splitSachinAmount = roundTo2((totalAmount * sachinPercent) / 100);
  const splitSuryaAmount = roundTo2(totalAmount - splitSachinAmount);

  return {
    ok: true,
    result: {
      splitSachinPercent: sachinPercent,
      splitSuryaPercent: suryaPercent,
      splitSachinAmount,
      splitSuryaAmount,
    },
  };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim().toLowerCase());
}

export function parseCcEmails(value: unknown): string[] {
  const tokens = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

  const normalized = tokens
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean)
    .filter((entry) => isValidEmail(entry));

  return Array.from(new Set(normalized));
}

export function sanitizeReason(value: unknown): string {
  return String(value || "").trim();
}

export function sanitizeOptionalText(value: unknown): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

export function sanitizeSearch(value: unknown): string {
  return toSafeSearch(String(value || ""));
}

export function parseAttachments(value: unknown): ReceiptAttachment[] {
  if (!Array.isArray(value)) return [];

  const parsed: ReceiptAttachment[] = [];

  for (const item of value) {
    const name = String((item as any)?.name || "").trim();
    const url = String((item as any)?.url || "").trim();
    if (!name || !url) continue;

    parsed.push({
      name,
      url,
      type: String((item as any)?.type || "").trim() || undefined,
      size: Number.isFinite(Number((item as any)?.size)) ? Number((item as any)?.size) : undefined,
      uploadedAt:
        String((item as any)?.uploadedAt || "").trim() || new Date().toISOString(),
    });
  }

  return parsed;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendAccountsEmail(input: {
  to: string;
  cc?: string[];
  subject: string;
  html: string;
  adminEmail: string;
}): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "Email service not configured" };
  }

  const cc = Array.isArray(input.cc)
    ? Array.from(
        new Set(
          input.cc
            .map((entry) => String(entry || "").trim().toLowerCase())
            .filter(Boolean)
            .filter((entry) => isValidEmail(entry))
        )
      )
    : [];

  const payload: {
    from: string;
    to: string;
    cc?: string[];
    subject: string;
    html: string;
  } = {
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
  };

  if (cc.length) {
    payload.cc = cc;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    await supabaseAdmin.from("intern_email_log").insert({
      recipient_email: input.to,
      subject: input.subject,
      template_id: null,
      sent_by_admin_email: input.adminEmail,
      resend_message_id: data?.id || null,
      status: response.ok ? "sent" : "failed",
    });

    if (response.ok) {
      return { success: true, messageId: data.id };
    }

    return {
      success: false,
      error: data?.message || data?.error || data,
    };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendNewExpenseEmail(input: {
  createdByUser: AccountsUser;
  reason: string;
  totalAmount: number;
  expenseDate: string;
  splitSachinPercent: number;
  splitSuryaPercent: number;
  splitSachinAmount: number;
  splitSuryaAmount: number;
  ccEmails: string[];
  internalNotes?: string | null;
}) {
  const subject = `[SOCIO Accounts] New Expense Added - ${input.reason.slice(0, 50)}`;

  const safeCreatedBy = escapeHtml(input.createdByUser);
  const safeExpenseDate = escapeHtml(input.expenseDate);
  const safeReason = escapeHtml(input.reason);
  const safeNotes = input.internalNotes ? escapeHtml(input.internalNotes) : null;

  const content = `
    <h2 style="margin: 0 0 12px; font-size: 18px;">New Expense Added</h2>
    <p style="margin: 0 0 10px;"><strong>Created By:</strong> ${safeCreatedBy}</p>
    <p style="margin: 0 0 10px;"><strong>Expense Date:</strong> ${safeExpenseDate}</p>
    <p style="margin: 0 0 10px;"><strong>Reason:</strong> ${safeReason}</p>
    <p style="margin: 0 0 10px;"><strong>Total:</strong> ${formatINR(input.totalAmount)}</p>
    <p style="margin: 0 0 10px;"><strong>Split:</strong> Sachin ${input.splitSachinPercent}% (${formatINR(
      input.splitSachinAmount
    )}), Surya ${input.splitSuryaPercent}% (${formatINR(input.splitSuryaAmount)})</p>
    ${
      safeNotes
        ? `<p style="margin: 0 0 10px;"><strong>Notes:</strong> ${safeNotes}</p>`
        : ""
    }
    <p style="margin: 16px 0 0; color: #475569; font-size: 13px;">This expense is awaiting approvals from sachin and surya.</p>
  `;

  return sendAccountsEmail({
    to: DEFAULT_EXPENSE_NOTIFY_TO,
    cc: input.ccEmails,
    subject,
    html: buildSocioEmailHtml({
      subject,
      htmlContent: content,
      senderEmail: "accounts@withsocio.com",
    }),
    adminEmail: `accounts-${input.createdByUser}@withsocio.com`,
  });
}

export { supabaseAdmin };
