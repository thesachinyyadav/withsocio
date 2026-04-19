import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPrefix = (value: string) => /^[a-z0-9._-]{1,32}$/i.test(value);
const DEFAULT_MAILBOX_PATH = "/socio/mail";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const toPlainTextEmail = (text: string, html: string) => {
  const normalizedText = String(text || "").trim();
  if (normalizedText) return normalizedText;
  return stripHtml(String(html || ""));
};

const generateHtmlEmail = (textBody: string, senderAddress: string): string => {
  const escapedBody = escapeHtml(textBody)
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line}</p>` : "<br />"))
    .join("");

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
            ${escapedBody}
        </div>
        
        <div class="footer">
            <div class="footer-links">
            <a href="https://live.withsocio.com">Visit SOCIO</a>
            <span>|</span>
                <a href="mailto:${escapeHtml(senderAddress)}?subject=UNSUBSCRIBE">Unsubscribe</a>
            </div>
            <div class="divider"></div>
            <div class="footer-text">
            <p style="margin: 0; color: #d7e3ff;">© 2026 SOCIO. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; color: #c5d8ff;">This email was sent from ${escapeHtml(senderAddress)}</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
};

const getMailboxUrl = (request: Request) => {
  const configuredUrl = (process.env.MAILBOX_APP_URL || "").trim();
  if (configuredUrl) return configuredUrl;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");

  const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
  const resolvedHost = forwardedHost || host;

  if (resolvedHost) {
    return `${protocol}://${resolvedHost}${DEFAULT_MAILBOX_PATH}`;
  }

  return `https://withsocio.com${DEFAULT_MAILBOX_PATH}`;
};

const sendTelegram = async (message: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";

  if (!token || !chatId) {
    return { ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    return { ok: false, error: payload?.description || "Telegram send failed" };
  }

  return { ok: true };
};

const parseEmailList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const toRaw = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const text = String(body?.text || "").trim();
  const html = String(body?.html || "").trim();
  const senderPrefix = String(body?.senderPrefix || "").trim().toLowerCase();
  const ccInput = body?.cc;
  const bccInput = body?.bcc;

  if (!toRaw || !subject || (!text && !html)) {
    return NextResponse.json(
      { error: "Missing required fields (to, subject, body)" },
      { status: 400 }
    );
  }

  if (!senderPrefix || !isValidPrefix(senderPrefix)) {
    return NextResponse.json(
      { error: "Invalid sender prefix. Use letters, numbers, dot, underscore, or dash." },
      { status: 400 }
    );
  }

  const to = parseEmailList(toRaw);

  if (!to.length || to.some((entry) => !isValidEmail(entry))) {
    return NextResponse.json({ error: "Invalid recipient email(s)" }, { status: 400 });
  }

  const cc = parseEmailList(ccInput).filter((entry: string) => isValidEmail(entry));
  const bcc = parseEmailList(bccInput).filter((entry: string) => isValidEmail(entry));

  const senderAddress = `${senderPrefix}@withsocio.com`;

  try {
    const appUrl = getMailboxUrl(request);
    const textBody = toPlainTextEmail(text, html);
    const htmlBody = generateHtmlEmail(textBody, senderAddress);

    const payload: Record<string, unknown> = {
      from: `SOCIO <${senderAddress}>`,
      to,
      subject,
      replyTo: senderAddress,
      text: textBody,
      html: htmlBody,
      headers: {
        "List-Unsubscribe": `<mailto:${senderAddress}?subject=UNSUBSCRIBE>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    if (cc.length) payload.cc = Array.from(new Set(cc));
    if (bcc.length) payload.bcc = Array.from(new Set(bcc));

    const result = await resend.emails.send(payload as any);

    if ((result as any)?.error) {
      return NextResponse.json(
        { error: (result as any).error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    const textSummary = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const preview = textSummary ? `${textSummary.slice(0, 120)}${textSummary.length > 120 ? "…" : ""}` : "(no preview)";

    const message = [
      "📤 <b>SOCIO Mail Sent</b>",
      `From: <b>${escapeHtml(senderAddress)}</b>`,
      `To: ${escapeHtml(to.join(", "))}`,
      `Subject: ${escapeHtml(subject)}`,
      `Preview: ${escapeHtml(preview)}`,
      `<a href=\"${appUrl}\">Open Mailbox</a>`,
    ].join("\n");

    const telegramResult = await sendTelegram(message);

    if (!telegramResult.ok) {
      console.error("Telegram send alert error:", telegramResult.error);
    }

    return NextResponse.json({
      success: true,
      data: (result as any)?.data || null,
      telegramNotified: telegramResult.ok,
      telegramError: telegramResult.ok ? null : telegramResult.error,
    });
  } catch (error) {
    console.error("Mailbox send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
