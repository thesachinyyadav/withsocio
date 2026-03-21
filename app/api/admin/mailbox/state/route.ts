import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

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

  return NextResponse.json({ success: true });
}
