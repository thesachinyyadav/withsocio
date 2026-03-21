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

  try {
    const receivingClient = (resend as any).emails?.receiving;

    if (!receivingClient?.get) {
      return NextResponse.json(
        { error: "Resend receive detail API is not available in this SDK version." },
        { status: 500 }
      );
    }

    const result = await receivingClient.get(emailId);

    if (result?.error) {
      return NextResponse.json({ error: result.error.message || "Failed to retrieve email" }, { status: 500 });
    }

    return NextResponse.json({ data: result?.data || null });
  } catch (error) {
    console.error("Mailbox received detail error:", error);
    return NextResponse.json({ error: "Failed to retrieve email" }, { status: 500 });
  }
}
