import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ emailId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailId } = await context.params;

  if (!emailId) {
    return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  try {
    const receivingClient = (resend as any).emails?.receiving;

    if (receivingClient?.get) {
      const result = await receivingClient.get(emailId);

      if (result?.error) {
        return NextResponse.json({ error: result.error.message || "Failed to retrieve email" }, { status: 500 });
      }

      return NextResponse.json({ data: result?.data || null });
    }

    const fallbackResponse = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    });

    const fallbackPayload = await fallbackResponse.json().catch(() => ({}));

    if (!fallbackResponse.ok) {
      return NextResponse.json(
        { error: fallbackPayload?.message || fallbackPayload?.error || "Failed to retrieve email" },
        { status: fallbackResponse.status || 500 }
      );
    }

    return NextResponse.json({ data: fallbackPayload || null });
  } catch (error) {
    console.error("Mailbox received detail error:", error);
    return NextResponse.json({ error: "Failed to retrieve email" }, { status: 500 });
  }
}
