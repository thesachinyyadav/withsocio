import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  ACCOUNTS_STATUSES,
  DEFAULT_EXPENSE_NOTIFY_TO,
  authenticateAccountsUser,
  calculateSplit,
  parseAttachments,
  parseCcEmails,
  parsePositiveNumber,
  sanitizeOptionalText,
  sanitizeReason,
  sanitizeSearch,
  sendNewExpenseEmail,
  supabaseAdmin,
} from "./_utils";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parsePage(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "25");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 25;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  return { safePage, safeLimit, from, to };
}

function toAmount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  const auth = authenticateAccountsUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const view = String(searchParams.get("view") || "pending").trim().toLowerCase();
    const q = sanitizeSearch(searchParams.get("q") || "");
    const { safePage, safeLimit, from, to } = parsePage(searchParams);

    let query = supabaseAdmin
      .from("accounts_expenses")
      .select("*", { count: "exact" })
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (view === "pending") {
      query = query.eq("status", "pending_approval");
    } else if (view === "processed") {
      query = query.in("status", ["purchased", "settled"]);
    }

    if (q) {
      query = query.or(`reason.ilike.%${q}%,internal_notes.ilike.%${q}%`);
    }

    query = query.range(from, to);

    const [listResult, pendingCount, purchasedCount, settledCount, summaryRows] = await Promise.all([
      query,
      supabaseAdmin
        .from("accounts_expenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval"),
      supabaseAdmin
        .from("accounts_expenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "purchased"),
      supabaseAdmin
        .from("accounts_expenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "settled"),
      supabaseAdmin
        .from("accounts_expenses")
        .select("status,total_amount,split_sachin_amount,split_surya_amount"),
    ]);

    if (listResult.error) {
      return NextResponse.json({ error: listResult.error.message }, { status: 500 });
    }

    if (summaryRows.error) {
      return NextResponse.json({ error: summaryRows.error.message }, { status: 500 });
    }

    const summary = {
      totalExpenses: 0,
      totalAmount: 0,
      pendingApprovalAmount: 0,
      purchasedAmount: 0,
      settledAmount: 0,
      pendingClearanceAmount: 0,
      sachinShareTotal: 0,
      suryaShareTotal: 0,
      pendingApprovalCount: pendingCount.count || 0,
      purchasedCount: purchasedCount.count || 0,
      settledCount: settledCount.count || 0,
    };

    for (const row of summaryRows.data || []) {
      const totalAmount = toAmount((row as { total_amount?: unknown }).total_amount);
      const sachinShare = toAmount((row as { split_sachin_amount?: unknown }).split_sachin_amount);
      const suryaShare = toAmount((row as { split_surya_amount?: unknown }).split_surya_amount);
      const status = String((row as { status?: string }).status || "");

      summary.totalExpenses += 1;
      summary.totalAmount += totalAmount;
      summary.sachinShareTotal += sachinShare;
      summary.suryaShareTotal += suryaShare;

      if (status === "pending_approval") {
        summary.pendingApprovalAmount += totalAmount;
      } else if (status === "purchased") {
        summary.purchasedAmount += totalAmount;
      } else if (status === "settled") {
        summary.settledAmount += totalAmount;
      }
    }

    summary.pendingClearanceAmount = summary.pendingApprovalAmount + summary.purchasedAmount;

    return NextResponse.json({
      success: true,
      currentUser: auth.user,
      data: listResult.data || [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: listResult.count || 0,
        pages: Math.ceil((listResult.count || 0) / safeLimit),
      },
      counts: {
        pending: pendingCount.count || 0,
        purchased: purchasedCount.count || 0,
        settled: settledCount.count || 0,
      },
      summary,
      allowedStatuses: ACCOUNTS_STATUSES,
    });
  } catch (error) {
    console.error("[ACCOUNTS] Failed to fetch expenses", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticateAccountsUser(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));

    const reason = sanitizeReason(body?.reason);
    const internalNotes = sanitizeOptionalText(body?.internalNotes);
    const expenseDateRaw = String(body?.expenseDate || "").trim();
    const expenseDate = isIsoDate(expenseDateRaw)
      ? expenseDateRaw
      : new Date().toISOString().split("T")[0];

    if (!reason) {
      return NextResponse.json({ error: "Reason is required." }, { status: 400 });
    }

    if (reason.length > 2000) {
      return NextResponse.json({ error: "Reason must be 2000 characters or less." }, { status: 400 });
    }

    const totalAmount = parsePositiveNumber(body?.totalAmount);
    const sachinPercent = Number(body?.splitSachinPercent);
    const suryaPercent = Number(body?.splitSuryaPercent);

    if (!totalAmount) {
      return NextResponse.json({ error: "Total amount must be greater than 0." }, { status: 400 });
    }

    if (!Number.isFinite(sachinPercent) || !Number.isFinite(suryaPercent)) {
      return NextResponse.json(
        { error: "Both split percentages are required." },
        { status: 400 }
      );
    }

    const split = calculateSplit({
      totalAmount,
      sachinPercent,
      suryaPercent,
    });

    if (!split.ok) {
      return NextResponse.json({ error: split.error }, { status: 400 });
    }

    const ccEmails = parseCcEmails(body?.ccEmails).filter(
      (email) => email !== DEFAULT_EXPENSE_NOTIFY_TO
    );

    const receiptAttachments = parseAttachments(body?.receiptAttachments).slice(0, 8);

    const { data: created, error: createError } = await supabaseAdmin
      .from("accounts_expenses")
      .insert({
        expense_date: expenseDate,
        reason,
        total_amount: totalAmount,
        currency: "INR",
        status: "pending_approval",
        created_by_user: auth.user,
        split_sachin_percent: split.result.splitSachinPercent,
        split_surya_percent: split.result.splitSuryaPercent,
        split_sachin_amount: split.result.splitSachinAmount,
        split_surya_amount: split.result.splitSuryaAmount,
        receipt_attachments: receiptAttachments,
        internal_notes: internalNotes,
        cc_emails: ccEmails,
        last_updated_by_user: auth.user,
      })
      .select("*")
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const emailResult = await sendNewExpenseEmail({
      createdByUser: auth.user,
      reason,
      totalAmount,
      expenseDate,
      splitSachinPercent: split.result.splitSachinPercent,
      splitSuryaPercent: split.result.splitSuryaPercent,
      splitSachinAmount: split.result.splitSachinAmount,
      splitSuryaAmount: split.result.splitSuryaAmount,
      ccEmails,
      internalNotes,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
        email: {
          sent: emailResult.success,
          error: emailResult.success ? null : emailResult.error,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ACCOUNTS] Failed to create expense", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
