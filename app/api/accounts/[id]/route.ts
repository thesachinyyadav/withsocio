import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  authenticateAccountsUser,
  parseAttachments,
  sanitizeOptionalText,
  supabaseAdmin,
} from "../_utils";

type AccountsExpenseRow = {
  id: string;
  status: "pending_approval" | "purchased" | "settled";
  approval_sachin_at: string | null;
  approval_surya_at: string | null;
  receipt_attachments: unknown;
  internal_notes: string | null;
};

async function getExpenseById(id: string): Promise<{
  data: AccountsExpenseRow | null;
  error: string | null;
}> {
  const { data, error } = await supabaseAdmin
    .from("accounts_expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: (data as AccountsExpenseRow | null) || null, error: error?.message || null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateAccountsUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing expense id." }, { status: 400 });
  }

  const existing = await getExpenseById(id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }

  if (!existing.data) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, currentUser: auth.user, data: existing.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateAccountsUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing expense id." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "").trim();

  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  const existing = await getExpenseById(id);
  if (existing.error) {
    return NextResponse.json({ error: existing.error }, { status: 500 });
  }

  if (!existing.data) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const row = existing.data;

  if (action === "approve") {
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only pending expenses can be approved." },
        { status: 400 }
      );
    }

    const approvalField = auth.user === "sachin" ? "approval_sachin_at" : "approval_surya_at";
    if ((row as any)[approvalField]) {
      return NextResponse.json({ error: "You have already approved this expense." }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("accounts_expenses")
      .update({
        [approvalField]: new Date().toISOString(),
        last_updated_by_user: auth.user,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  }

  if (action === "mark_purchased") {
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only pending expenses can be marked as purchased." },
        { status: 400 }
      );
    }

    if (!row.approval_sachin_at || !row.approval_surya_at) {
      return NextResponse.json(
        { error: "Both sachin and surya approvals are required before purchase." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("accounts_expenses")
      .update({
        status: "purchased",
        purchased_at: new Date().toISOString(),
        last_updated_by_user: auth.user,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  }

  if (action === "mark_settled") {
    if (row.status !== "purchased") {
      return NextResponse.json(
        { error: "Only purchased expenses can be marked as settled." },
        { status: 400 }
      );
    }

    const nextInternalNotes = sanitizeOptionalText(body?.internalNotes);

    const { data, error } = await supabaseAdmin
      .from("accounts_expenses")
      .update({
        status: "settled",
        settled_at: new Date().toISOString(),
        internal_notes: nextInternalNotes ?? row.internal_notes,
        last_updated_by_user: auth.user,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  }

  if (action === "update_notes") {
    const nextInternalNotes = sanitizeOptionalText(body?.internalNotes);

    const { data, error } = await supabaseAdmin
      .from("accounts_expenses")
      .update({
        internal_notes: nextInternalNotes,
        last_updated_by_user: auth.user,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  }

  if (action === "add_receipts") {
    const nextAttachments = parseAttachments(body?.receiptAttachments);

    if (!nextAttachments.length) {
      return NextResponse.json({ error: "No valid receipt attachments provided." }, { status: 400 });
    }

    const existingAttachments = Array.isArray(row.receipt_attachments)
      ? row.receipt_attachments
      : [];
    const mergedAttachments = parseAttachments([...existingAttachments, ...nextAttachments]).slice(0, 20);

    const { data, error } = await supabaseAdmin
      .from("accounts_expenses")
      .update({
        receipt_attachments: mergedAttachments,
        last_updated_by_user: auth.user,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
