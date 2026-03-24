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

const wrapInSocioTemplate = (htmlContent: string): string => {
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
                <a href="mailto:interns@socio.tech?subject=UNSUBSCRIBE">Unsubscribe</a>
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
    const messageBody = customMessage || "You missed today's work log submission. Please submit your work log to keep your streak going!";

    const htmlContent = `<p>${escapeHtml(messageBody)}</p>`;
    const wrappedHtml = wrapInSocioTemplate(htmlContent);

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
    console.error("[REMINDER] Error:", error);
    return NextResponse.json({ error: `Internal server error: ${String(error)}` }, { status: 500 });
  }
}
