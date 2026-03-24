import { NextResponse, NextRequest } from "next/server";
import {
  authenticateRequest,
  createAuditLog,
  supabaseAdmin,
  WORK_LOG_STATUSES,
} from "../../_utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "").trim();
  const adminNotes = String(body?.adminNotes || "").trim();

  if (!WORK_LOG_STATUSES.includes(status as (typeof WORK_LOG_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("intern_work_logs")
    .select("id, progress_status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Work log not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("intern_work_logs")
    .update({
      progress_status: status,
      admin_notes: adminNotes || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createAuditLog({
    actorEmail: auth.identifier,
    action: "update_work_log_status",
    targetType: "work_log",
    targetId: id,
    oldStatus: existing.progress_status,
    newStatus: status,
    notes: adminNotes || null,
  });

  return NextResponse.json({ success: true, data });
}
