import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const emailId = String(body?.emailId || "").trim();
  const isRead = body?.isRead;
  const isStarred = body?.isStarred;

  if (!emailId) {
    return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    email_id: emailId,
    updated_at: new Date().toISOString(),
  };

  if (typeof isRead === "boolean") {
    updatePayload.is_read = isRead;
  }

  if (typeof isStarred === "boolean") {
    updatePayload.is_starred = isStarred;
  }

  if (typeof isRead !== "boolean" && typeof isStarred !== "boolean") {
    return NextResponse.json(
      { error: "Provide at least one of isRead or isStarred" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("mailbox_email_state")
    .upsert(updatePayload, { onConflict: "email_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const changes: string[] = [];
  if (typeof isRead === "boolean") {
    changes.push(isRead ? "Marked as read" : "Marked as unread");
  }
  if (typeof isStarred === "boolean") {
    changes.push(isStarred ? "Marked as starred" : "Removed star");
  }

  const appUrl = getMailboxUrl(request);
  const message = [
    "📝 <b>SOCIO Mail Updated</b>",
    `Email ID: <code>${emailId}</code>`,
    `Changes: ${changes.join(", ")}`,
    `<a href=\"${appUrl}\">Open Mailbox</a>`,
  ].join("\n");

  const telegramResult = await sendTelegram(message);

  return NextResponse.json({
    success: true,
    telegramNotified: telegramResult.ok,
    telegramError: telegramResult.ok ? null : telegramResult.error,
  });
}
