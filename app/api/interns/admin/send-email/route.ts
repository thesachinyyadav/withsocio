import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  sendEmail,
  createAuditLog,
} from "../../../_utils";

/**
 * POST /api/interns/admin/send-email
 * Send templated email to selected interns  
 * 
 * Request body:
 * {
 *   "recipientEmails": ["intern1@example.com", "intern2@example.com"],
 *   "subject": "Important Update",
 *   "htmlContent": "<h1>Update</h1><p>Content here</p>",
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
    const { recipientEmails, subject, htmlContent, templateVariables } = body;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "recipientEmails array is required" },
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

    // Send emails to each recipient
    for (const email of recipientEmails) {
      // Replace variables if provided
      let finalContent = htmlContent;
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
      action: "MASS_EMAIL_SENT",
      targetType: "email",
      notes: `Sent to ${successCount} recipients, ${failCount} failed`,
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: recipientEmails.length,
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
