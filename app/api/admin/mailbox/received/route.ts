import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type MailboxStateRecord = {
  email_id: string;
  is_read: boolean;
  is_starred: boolean;
};

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "20");
  const after = (searchParams.get("after") || "").trim();
  const before = (searchParams.get("before") || "").trim();

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  try {
    const receivingClient = (resend as any).emails?.receiving;

    const params: Record<string, string | number> = { limit: safeLimit };
    if (after) params.after = after;
    if (before) params.before = before;

    let data: any[] = [];
    let hasMore = false;
    let objectType = "list";

    if (receivingClient?.list) {
      const result = await receivingClient.list(params);

      if (result?.error) {
        return NextResponse.json({ error: result.error.message || "Failed to list received emails" }, { status: 500 });
      }

      data = result?.data?.data || [];
      hasMore = Boolean(result?.data?.has_more);
      objectType = result?.data?.object || "list";
    } else {
      const query = new URLSearchParams();
      query.set("limit", String(safeLimit));
      if (after) query.set("after", after);
      if (before) query.set("before", before);

      const fallbackResponse = await fetch(`https://api.resend.com/emails/receiving?${query.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
      });

      const fallbackPayload = await fallbackResponse.json().catch(() => ({}));

      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: fallbackPayload?.message || fallbackPayload?.error || "Failed to list received emails" },
          { status: fallbackResponse.status || 500 }
        );
      }

      data = Array.isArray(fallbackPayload?.data) ? fallbackPayload.data : [];
      hasMore = Boolean(fallbackPayload?.has_more);
      objectType = fallbackPayload?.object || "list";
    }

    const ids = data
      .map((item: any) => String(item?.id || "").trim())
      .filter(Boolean);

    let stateMap: Record<string, MailboxStateRecord> = {};

    if (ids.length) {
      const { data: stateRows, error: stateError } = await supabaseAdmin
        .from("mailbox_email_state")
        .select("email_id,is_read,is_starred")
        .in("email_id", ids);

      if (!stateError && Array.isArray(stateRows)) {
        stateMap = stateRows.reduce((acc: Record<string, MailboxStateRecord>, row: any) => {
          const key = String(row?.email_id || "");
          if (!key) return acc;
          acc[key] = {
            email_id: key,
            is_read: Boolean(row?.is_read),
            is_starred: Boolean(row?.is_starred),
          };
          return acc;
        }, {});
      }
    }

    const enrichedData = data.map((item: any) => {
      const state = stateMap[String(item?.id || "")];
      return {
        ...item,
        is_read: state ? state.is_read : false,
        is_starred: state ? state.is_starred : false,
      };
    });

    return NextResponse.json({
      data: enrichedData,
      has_more: hasMore,
      object: objectType,
      first_id: data?.[0]?.id || null,
      last_id: data?.[data.length - 1]?.id || null,
    });
  } catch (error) {
    console.error("Mailbox received list error:", error);
    return NextResponse.json({ error: "Failed to list received emails" }, { status: 500 });
  }
}
