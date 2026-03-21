import { NextResponse } from "next/server";

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";
const DEFAULT_MAILBOX_PATH = "/careers/christid/mailbox";

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

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  const appUrl = getMailboxUrl(request);

  if (!token || !chatId) {
    return NextResponse.json(
      { error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
      { status: 400 }
    );
  }

  const message = [
    "✅ <b>SOCIO Mail Telegram Test</b>",
    "Your alert integration is active.",
    `<a href=\"${appUrl}\">Open Mailbox</a>`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    return NextResponse.json(
      { error: payload?.description || "Telegram send failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
