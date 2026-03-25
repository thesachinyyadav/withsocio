import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  authenticateRequest,
  sendEmail,
  createAuditLog,
} from "../../_utils";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const wrapInSocioTemplate = (htmlContent: string, senderEmail: string): string => {
  // Remove any outer HTML/body tags from htmlContent if present
  let cleanContent = htmlContent
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<\/?head[^>]*>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .replace(/<\/?style[^>]*>[\s\S]*?<\/style>/gi, "")
    .trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOCIO Mail</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #154CB3;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #0f3d8f;
            border-radius: 10px;
            overflow: hidden;
        }
        .header {
            background: #154CB3;
            padding: 20px 24px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 32px 24px;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 14px;
            line-height: 1.7;
            color: #444;
        }
        .content p:last-of-type {
            margin-bottom: 0;
        }
        .footer {
            background-color: #154CB3;
            padding: 24px;
            border-top: 1px solid #0f3d8f;
            text-align: center;
            font-size: 12px;
            color: #eaf0ff;
        }
        .footer-links {
            margin-bottom: 16px;
        }
        .footer-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 8px;
            display: inline-block;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .footer-text {
            font-size: 11px;
            color: #d7e3ff;
            margin-top: 12px;
        }
        .divider {
            height: 1px;
            background-color: rgba(255, 255, 255, 0.3);
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SOCIO</h1>
            <p>Professional Correspondence</p>
        </div>
        
        <div class="content">
            ${cleanContent}
        </div>
        
        <div class="footer">
            <div class="footer-links">
            <a href="https://live.withsocio.com">Visit SOCIO</a>
            <span>|</span>
                <a href="mailto:${escapeHtml(senderEmail)}?subject=UNSUBSCRIBE">Unsubscribe</a>
            </div>
            <div class="divider"></div>
            <div class="footer-text">
            <p style="margin: 0; color: #d7e3ff;">© 2026 SOCIO. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; color: #c5d8ff;">This email was sent from SOCIO</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
};

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
      baseContent = wrapInSocioTemplate(htmlContent, "interns@socio.tech");
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
