import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  createAuditLog,
  sendEmail,
  REPORT_STATUSES,
} from "../../_utils";

/**
 * PATCH /api/interns/reports/[id]
 * Admin-only: Update report status and/or assign to people
 * 
 * Request body:
 * {
 *   "status": "open" | "in_progress" | "resolved" | "closed",
 *   "assignedToEmails": ["dev1@socio.tech", "dev2@socio.tech"],
 *   "adminNotes": "Working on this issue"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedToEmails, adminNotes } = body;

    // Get current report
    const { data: currentReport, error: fetchError } = await supabaseAdmin
      .from("intern_reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !currentReport) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};

    if (status && REPORT_STATUSES.includes(status)) {
      updates.status = status;
    }

    if (assignedToEmails) {
      updates.assigned_to_emails = assignedToEmails;
    }

    if (adminNotes !== undefined) {
      updates.admin_notes = adminNotes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Update report
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from("intern_reports")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit log
    await createAuditLog({
      actorEmail: auth.identifier,
      action: "REPORT_UPDATED",
      targetType: "report",
      targetId: id,
      oldStatus: currentReport.status,
      newStatus: status || undefined,
      assignedToEmail: assignedToEmails?.[0] || undefined,
      notes: adminNotes,
    });

    // Send notification emails to assignees
    if (assignedToEmails && assignedToEmails.length > 0) {
      for (const assigneeEmail of assignedToEmails) {
        await sendEmail({
          to: assigneeEmail,
          subject: `[INTERNS] Report Assigned: ${updatedReport.title}`,
          html: `
            <h2>New Report Assignment</h2>
            <p><strong>Category:</strong> ${updatedReport.category}</p>
            <p><strong>Title:</strong> ${updatedReport.title}</p>
            <p><strong>Priority:</strong> ${updatedReport.priority}</p>
            <p><strong>Details:</strong></p>
            <p>${updatedReport.details}</p>
            ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ""}
          `,
          adminEmail: auth.identifier,
        });
      }
    }

    // Send update email to reporter
    if (status && status !== currentReport.status) {
      await sendEmail({
        to: currentReport.created_by_email,
        subject: `[INTERNS] Your Report Status Updated`,
        html: `
          <h2>Report Status Update</h2>
          <p><strong>Report:</strong> ${updatedReport.title}</p>
          <p><strong>Status:</strong> ${currentReport.status} → ${status}</p>
          ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ""}
        `,
        adminEmail: auth.identifier,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
