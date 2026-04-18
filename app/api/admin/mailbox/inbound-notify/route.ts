import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getNotifySecret = () => process.env.MAILBOX_NOTIFY_SECRET || "";
const DEFAULT_MAILBOX_PATH = "/socio/careers/christid/mailbox";

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
  const secret = getNotifySecret();
  if (!secret) return false;

  const headerSecret = request.headers.get("x-mailbox-secret") || "";
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return headerSecret === secret || bearer === secret;
};

const parsePayload = async (request: Request): Promise<any> => {
  const raw = await request.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};

const extractField = (payload: any, keys: string[]): string => {
  for (const key of keys) {
    const value = key.split(".").reduce((acc: any, part: string) => (acc ? acc[part] : undefined), payload);
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const first = value.find(Boolean);
      if (first) return String(first);
    } else {
      const trimmed = String(value).trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
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

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await parsePayload(request);

  const emailId = extractField(payload, ["data.id", "id", "email.id"]);
  const messageId = extractField(payload, ["data.message_id", "message_id", "email.message_id"]);
  const from = extractField(payload, ["data.from", "from", "email.from"]);
  const subject = extractField(payload, ["data.subject", "subject", "email.subject"]);
  const createdAt = extractField(payload, ["data.created_at", "created_at", "timestamp"]) || new Date().toISOString();

  const eventKey = messageId || emailId || `${from}-${subject}-${createdAt}`;

  const { error: insertError } = await supabaseAdmin
    .from("mailbox_notification_log")
    .insert({
      event_key: eventKey,
      email_id: emailId || null,
      message_id: messageId || null,
      from_email: from || null,
      subject: subject || null,
      received_at: createdAt,
      raw_payload: payload,
    });

  if (insertError && !String(insertError.message || "").toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (!insertError) {
    const appUrl = getMailboxUrl(request);
    const text = [
      "📩 <b>New SOCIO Mail</b>",
      from ? `From: <b>${from}</b>` : "From: (unknown)",
      subject ? `Subject: ${subject}` : "Subject: (no subject)",
      `Time: ${new Date(createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      `<a href=\"${appUrl}\">Open Mailbox</a>`,
    ].join("\n");

    const telegramResult = await sendTelegram(text);
    if (!telegramResult.ok) {
      return NextResponse.json({ error: telegramResult.error }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, deduped: Boolean(insertError) });
}
