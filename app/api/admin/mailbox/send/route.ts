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

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const toRaw = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const text = String(body?.text || "").trim();
  const html = String(body?.html || "").trim();
  const ccInput = Array.isArray(body?.cc) ? body.cc : [];

  if (!toRaw || !subject || (!text && !html)) {
    return NextResponse.json(
      { error: "Missing required fields (to, subject, body)" },
      { status: 400 }
    );
  }

  const to = toRaw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!to.length || to.some((entry) => !isValidEmail(entry))) {
    return NextResponse.json({ error: "Invalid recipient email(s)" }, { status: 400 });
  }

  const cc = ccInput
    .map((entry: unknown) => String(entry || "").trim().toLowerCase())
    .filter(Boolean)
    .filter((entry: string) => isValidEmail(entry));

  try {
    const payload: Record<string, unknown> = {
      from: "SOCIO Careers <careers@withsocio.com>",
      to,
      subject,
      replyTo: "careers@withsocio.com",
      headers: {
        "List-Unsubscribe": "<mailto:careers@withsocio.com?subject=UNSUBSCRIBE>",
      },
    };

    if (cc.length) payload.cc = Array.from(new Set(cc));
    if (text) payload.text = text;
    if (html) payload.html = html;

    const result = await resend.emails.send(payload as any);

    if ((result as any)?.error) {
      return NextResponse.json(
        { error: (result as any).error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: (result as any)?.data || null });
  } catch (error) {
    console.error("Mailbox send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
