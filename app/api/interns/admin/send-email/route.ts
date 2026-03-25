import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  sendEmail,
  createAuditLog,
  buildSocioEmailHtml,
} from "../../_utils";

/**
 * POST /api/interns/admin/send-email
 * Send templated email to selected interns or all hired interns
 * 
 * Request body:
 * {
 *   "recipientEmails": ["intern1@example.com", "intern2@example.com"],
 *   "subject": "Important Update",
 *   "htmlContent": "<h1>Update</h1><p>Content here</p>",
 *   "sendToAllHiredInterns": false,
 *   "useSocioTemplate": true,
 *   "templateVariables": {
 *     "intern1@example.com": { "name": "John", "points": 100 }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { 
      recipientEmails, 
      subject, 
      htmlContent, 
      templateVariables,
      sendToAllHiredInterns = false,
      useSocioTemplate = false
    } = body;

    let finalRecipientEmails: string[] = [];

    // Get recipient list
    if (sendToAllHiredInterns) {
      // Fetch all hired interns
      const { data: hiredInterns, error } = await supabaseAdmin
        .from("internship_applications")
        .select("email")
        .eq("status", "hired");

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch hired interns: " + error.message },
          { status: 500 }
        );
      }

      finalRecipientEmails = (hiredInterns || [])
        .map((i: any) => String(i.email || "").trim().toLowerCase())
        .filter(Boolean);
    } else if (recipientEmails && Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      finalRecipientEmails = recipientEmails.map((e: string) => String(e || "").trim().toLowerCase()).filter(Boolean);
    } else {
      return NextResponse.json(
        { error: "Either recipientEmails array or sendToAllHiredInterns flag is required" },
        { status: 400 }
      );
    }

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: "subject and htmlContent are required" },
        { status: 400 }
      );
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Prepare email content wrapper
    let baseContent = htmlContent;
    if (useSocioTemplate) {
      baseContent = buildSocioEmailHtml({
        subject,
        htmlContent,
        senderEmail: "careers@withsocio.com",
      });
    }

    // Send emails to each recipient
    for (const email of finalRecipientEmails) {
      // Replace variables if provided
      let finalContent = baseContent;
      if (templateVariables && templateVariables[email]) {
        const vars = templateVariables[email];
        Object.entries(vars).forEach(([key, value]) => {
          finalContent = finalContent.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        });
      }

      const result = await sendEmail({
        to: email,
        subject,
        html: finalContent,
        adminEmail: auth.identifier,
      });

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
      action: sendToAllHiredInterns ? "MASS_EMAIL_ALL_INTERNS_SENT" : "MASS_EMAIL_SENT",
      targetType: "email",
      notes: `Sent to ${successCount} recipients, ${failCount} failed`,
    });

    if (failCount === finalRecipientEmails.length) {
      return NextResponse.json(
        {
          success: false,
          error: typeof results[0]?.error === "string" ? results[0].error : "All emails failed to send",
          summary: {
            total: finalRecipientEmails.length,
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
        total: finalRecipientEmails.length,
        successCount,
        failCount,
      },
      results,
    });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/interns/admin/send-email
 * Get list of email templates
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { data: templates, error } = await supabaseAdmin
      .from("intern_email_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: templates || [] });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
