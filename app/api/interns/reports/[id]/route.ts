import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  createAuditLog,
  REPORT_STATUSES,
  sendEmail,
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
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedToEmails, adminNotes, claimOwnership } = body;

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

    if (auth.role === "intern") {
      const wantsClaim = claimOwnership === true;
      const wantsStatusUpdate =
        typeof status === "string" && REPORT_STATUSES.includes(status as any);

      const currentlyAssigned: string[] = Array.isArray(currentReport.assigned_to_emails)
        ? currentReport.assigned_to_emails
        : [];
      const internOwnsReport = currentlyAssigned
        .map((email: string) => String(email).toLowerCase())
        .includes(auth.identifier.toLowerCase());

      if (!wantsClaim && !wantsStatusUpdate) {
        return NextResponse.json(
          { error: "Interns can only claim ownership or update status" },
          { status: 403 }
        );
      }

      if (wantsClaim) {
        updates.assigned_to_emails = [auth.identifier];
        if (currentReport.status === "open" && !wantsStatusUpdate) {
          updates.status = "in_progress";
        }
      }

      if (wantsStatusUpdate) {
        if (!internOwnsReport && !wantsClaim) {
          return NextResponse.json(
            { error: "Claim this report first to update status" },
            { status: 403 }
          );
        }
        updates.status = status;
      }
    }

    if (auth.role === "admin") {
      if (status && REPORT_STATUSES.includes(status)) {
        updates.status = status;
      }

      if (assignedToEmails) {
        updates.assigned_to_emails = assignedToEmails;
      }

      if (adminNotes !== undefined) {
        updates.admin_notes = adminNotes;
      }
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
      action:
        auth.role === "admin"
          ? "REPORT_UPDATED"
          : updates.status && updates.assigned_to_emails
            ? "REPORT_CLAIMED_AND_STATUS_UPDATED"
            : updates.status
              ? "REPORT_STATUS_UPDATED"
              : "REPORT_CLAIMED",
      targetType: "report",
      targetId: id,
      oldStatus: currentReport.status,
      newStatus: updates.status || undefined,
      assignedToEmail:
        updates.assigned_to_emails?.[0] || assignedToEmails?.[0] || undefined,
      notes: auth.role === "admin" ? adminNotes : "Claimed by intern",
    });

    // Send notification emails to assignees
    const assigneesForNotify: string[] =
      updates.assigned_to_emails || assignedToEmails || [];

    if (assigneesForNotify.length > 0 && auth.role === "admin") {
      for (const assigneeEmail of assigneesForNotify) {
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
