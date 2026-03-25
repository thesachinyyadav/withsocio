import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  sendEmail,
  createAuditLog,
  buildSocioEmailHtml,
} from "../../_utils";

/**
 * POST /api/interns/admin/send-work-log-reminder
 * Send work log submission reminder email to specific interns
 * 
 * Request body:
 * {
 *   "internEmails": ["intern1@example.com"],
 *   "customMessage": "Optional custom message here"
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { internEmails, customMessage } = body;

    if (!internEmails || !Array.isArray(internEmails) || internEmails.length === 0) {
      return NextResponse.json(
        { error: "internEmails array is required" },
        { status: 400 }
      );
    }

    const recipientEmails = internEmails
      .map((e: string) => String(e || "").trim().toLowerCase())
      .filter(Boolean);

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400 }
      );
    }

    const subject = "Reminder: Daily Work Log Submission";
    const messageBody =
      customMessage ||
      "You missed today's work log submission. Please submit your work log to keep your streak going!";

    const htmlContent = messageBody
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((line: string) => `<p>${line}</p>`)
      .join("");
    const wrappedHtml = buildSocioEmailHtml({
      subject,
      htmlContent,
      senderEmail: "careers@withsocio.com",
    });

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Send emails to each recipient
    console.log(`[REMINDER] Sending to ${recipientEmails.length} interns`);
    console.log(`[REMINDER] Subject: ${subject}`);
    console.log(`[REMINDER] Recipients:`, recipientEmails);
    
    for (const email of recipientEmails) {
      console.log(`[REMINDER] Attempting to send to ${email}...`);
      const result = await sendEmail({
        to: email,
        subject,
        html: wrappedHtml,
        adminEmail: auth.identifier,
      });

      console.log(`[REMINDER] Result for ${email}:`, result);

      if (result.success) {
        successCount++;
        results.push({ email, success: true, messageId: result.messageId });
      } else {
        failCount++;
        results.push({ email, success: false, error: result.error });
      }
    }

    // Audit log
    await createAuditLog({
      actorEmail: auth.identifier,
      action: "WORK_LOG_REMINDER_SENT",
      targetType: "email",
      notes: `Sent work log reminders to ${successCount} interns, ${failCount} failed`,
    });

    console.log(`[REMINDER] Final result - Success: ${successCount}, Failed: ${failCount}`);

    if (failCount === recipientEmails.length) {
      return NextResponse.json(
        {
          success: false,
          error: typeof results[0]?.error === "string" ? results[0].error : "All reminder emails failed to send",
          summary: {
            total: recipientEmails.length,
            successCount,
            failCount,
          },
          results,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: failCount === 0,
      summary: {
        total: recipientEmails.length,
        successCount,
        failCount,
      },
      results,
    });
  } catch (error) {
    console.error("[REMINDER] Error:", error);
    return NextResponse.json({ error: `Internal server error: ${String(error)}` }, { status: 500 });
  }
}
