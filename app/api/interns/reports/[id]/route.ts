import { NextResponse } from "next/server";
import {
  authenticateRequest,
  createAuditLog,
  REPORT_STATUSES,
  supabaseAdmin,
} from "../../_utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "").trim();
  const adminNotes = String(body?.adminNotes || "").trim();

  if (!REPORT_STATUSES.includes(status as (typeof REPORT_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("intern_reports")
    .select("id, work_status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("intern_reports")
    .update({
      work_status: status,
      admin_notes: adminNotes || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createAuditLog({
    actor: "socio2026",
    action: "update_report_status",
    targetType: "report",
    targetId: id,
    oldStatus: existing.work_status,
    newStatus: status,
    notes: adminNotes || null,
  });

  return NextResponse.json({ success: true, data });
}
