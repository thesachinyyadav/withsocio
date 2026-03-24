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
const DEFAULT_MAILBOX_PATH = "/careers/christid/mailbox";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const generateHtmlEmail = (textBody: string, senderAddress: string, appUrl: string): string => {
  const escapedBody = escapeHtml(textBody)
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line}</p>` : "<br />"))
    .join("");

  const socioLogoSvg = encodeURIComponent(`<svg width="72" height="72" viewBox="0 0 319 94" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32.6035 80.4229C23.5462 80.4229 16.1087 78.2719 10.291 73.9646C4.4681 69.6625 1.3431 63.4959 0.916016 55.4646H23.9785C24.1973 58.1886 25.0098 60.1834 26.416 61.4438C27.8171 62.6938 29.6243 63.3188 31.8327 63.3188C33.8171 63.3188 35.4473 62.8188 36.7285 61.8188C38.0202 60.8188 38.666 59.4386 38.666 57.6729C38.666 55.3969 37.5931 53.6313 35.4577 52.3813C33.3327 51.1313 29.8743 49.7302 25.0827 48.1729C20.0098 46.4959 15.9056 44.8604 12.7702 43.2771C9.64518 41.6938 6.92122 39.3761 4.60352 36.3188C2.2806 33.2667 1.12435 29.2719 1.12435 24.3396C1.12435 19.3292 2.37435 15.0375 4.87435 11.4646C7.38477 7.89689 10.8535 5.19377 15.2702 3.36043C19.6868 1.51668 24.6868 0.5896 30.2702 0.5896C39.3223 0.5896 46.5514 2.70939 51.9577 6.94377C57.3744 11.1834 60.2702 17.1261 60.6452 24.7771H37.1244C37.0514 22.4177 36.3379 20.6521 34.9785 19.4854C33.6139 18.3084 31.8639 17.7146 29.7285 17.7146C28.1035 17.7146 26.7754 18.1938 25.7493 19.1521C24.7181 20.1 24.2077 21.4594 24.2077 23.2354C24.2077 24.7094 24.7754 25.9802 25.916 27.0479C27.0514 28.1052 28.4681 29.0219 30.166 29.7979C31.8587 30.5792 34.3587 31.5479 37.666 32.7146C42.6087 34.4125 46.6764 36.0896 49.8744 37.7563C53.0827 39.4125 55.8431 41.7302 58.166 44.7146C60.4837 47.6886 61.6452 51.4594 61.6452 56.0271C61.6452 60.6677 60.4837 64.8292 58.166 68.5063C55.8431 72.1886 52.4889 75.1 48.1035 77.2354C43.7285 79.3604 38.5619 80.4229 32.6035 80.4229Z" fill="#ffffff"/><path d="M100.38 80.4229C93.099 80.4229 86.4063 78.7146 80.2969 75.2979C74.1823 71.8709 69.3437 67.1209 65.776 61.0479C62.2031 54.9802 60.4219 48.1104 60.4219 40.4438C60.4219 32.7927 62.2031 25.9334 65.776 19.8604C69.3437 13.7927 74.1823 9.06356 80.2969 5.67293C86.4063 2.28752 93.099 0.5896 100.38 0.5896C107.74 0.5896 114.453 2.28752 120.526 5.67293C126.609 9.06356 131.411 13.7927 134.943 19.8604C138.484 25.9334 140.255 32.7927 140.255 40.4438C140.255 48.1104 138.484 54.9802 134.943 61.0479C131.411 67.1209 126.594 71.8709 120.484 75.2979C114.37 78.7146 107.672 80.4229 100.38 80.4229ZM100.38 60.3188C105.906 60.3188 110.266 58.5219 113.464 54.9229C116.672 51.3136 118.276 46.4854 118.276 40.4438C118.276 34.2667 116.672 29.3917 113.464 25.8188C110.266 22.2511 105.906 20.4646 100.38 20.4646C94.7813 20.4646 90.401 22.2511 87.2344 25.8188C84.0781 29.3917 82.5052 34.2667 82.5052 40.4438C82.5052 46.5584 84.0781 51.3969 87.2344 54.9646C90.401 58.5375 94.7813 60.3188 100.38 60.3188Z" fill="#ffffff"/></svg>`);
  const logoUrl = `data:image/svg+xml;charset=utf-8,${socioLogoSvg}`;

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
            background-color: #f8faff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #154CB3 0%, #0f3d8f 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
        }
        .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
        }
        .logo {
            width: 72px;
            height: 72px;
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.5px;
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
            background-color: #f8faff;
            padding: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer-links {
            margin-bottom: 16px;
        }
        .footer-links a {
            color: #154CB3;
            text-decoration: none;
            margin: 0 8px;
            display: inline-block;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .footer-text {
            font-size: 11px;
            color: #999;
            margin-top: 12px;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <div class="logo">
                    <img src="${logoUrl}" alt="SOCIO Logo" />
                </div>
            </div>
            <h1>SOCIO</h1>
            <p>Professional Correspondence</p>
        </div>
        
        <div class="content">
            ${escapedBody}
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="${escapeHtml(appUrl)}">Open Mailbox</a>
                <span>|</span>
                <a href="mailto:${escapeHtml(senderAddress)}?subject=UNSUBSCRIBE">Unsubscribe</a>
            </div>
            <div class="divider"></div>
            <div class="footer-text">
                <p style="margin: 0; color: #999;">© 2026 SOCIO. All rights reserved.</p>
                <p style="margin: 8px 0 0 0; color: #bbb;">This email was sent from ${escapeHtml(senderAddress)}</p>
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
    const htmlBody = generateHtmlEmail(text || html || "", senderAddress, appUrl);

    const payload: Record<string, unknown> = {
      from: `SOCIO <${senderAddress}>`,
      to,
      subject,
      replyTo: senderAddress,
      html: htmlBody,
      headers: {
        "List-Unsubscribe": `<mailto:${senderAddress}?subject=UNSUBSCRIBE>`,
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
