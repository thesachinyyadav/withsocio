import { NextResponse } from "next/server";
import {
  authenticateRequest,
  parsePage,
  resolveIdentifier,
  supabaseAdmin,
  toSafeSearch,
  WORK_LOG_STATUSES,
} from "../_utils";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const { safePage, safeLimit, from, to } = parsePage(searchParams);
  const status = (searchParams.get("status") || "").trim();
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const queryText = toSafeSearch(searchParams.get("q") || "");
  const fromDate = (searchParams.get("from") || "").trim();
  const toDate = (searchParams.get("to") || "").trim();

  let query = supabaseAdmin.from("intern_work_logs").select("*", { count: "exact" });

  if (status) {
    query = query.eq("progress_status", status);
  }

  if (email) {
    query = query.ilike("created_by_email", email);
  }

  if (fromDate) {
    query = query.gte("log_date", fromDate);
  }

  if (toDate) {
    query = query.lte("log_date", toDate);
  }

  if (queryText) {
    query = query.or(
      `title.ilike.%${queryText}%,description.ilike.%${queryText}%,collaborated_with.ilike.%${queryText}%,created_by_email.ilike.%${queryText}%`
    );
  }

  const { data, error, count } = await query
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const emails = Array.from(new Set(rows.map((row) => row.created_by_email).filter(Boolean)));

  let nameMap: Record<string, string> = {};
  if (emails.length > 0) {
    const { data: interns } = await supabaseAdmin
      .from("internship_applications")
      .select("email, full_name")
      .in("email", emails);

    nameMap = (interns || []).reduce<Record<string, string>>((acc, item) => {
      acc[(item.email || "").toLowerCase()] = item.full_name || item.email;
      return acc;
    }, {});
  }

  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      created_by_name: nameMap[(row.created_by_email || "").toLowerCase()] || row.created_by_email,
    })),
    filters: {
      statusOptions: WORK_LOG_STATUSES,
    },
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count || 0,
    },
  });
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => ({}));

  const logDate = String(body?.logDate || "").trim();
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const collaboratedWith = String(body?.collaboratedWith || "").trim();
  const progressStatus = String(body?.progressStatus || "submitted").trim();
  const createdByEmailInput = String(body?.createdByEmail || "").trim().toLowerCase();

  if (!logDate || !title || !description) {
    return NextResponse.json(
      { error: "logDate, title, and description are required." },
      { status: 400 }
    );
  }

  if (title.length > 180) {
    return NextResponse.json({ error: "Title must be 180 characters or less." }, { status: 400 });
  }

  if (description.length > 4000) {
    return NextResponse.json(
      { error: "Description must be 4000 characters or less." },
      { status: 400 }
    );
  }

  if (!WORK_LOG_STATUSES.includes(progressStatus as (typeof WORK_LOG_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid progressStatus." }, { status: 400 });
  }

  const createdByEmail =
    auth.role === "admin" ? createdByEmailInput : (auth.identifier || "").toLowerCase();

  if (!createdByEmail) {
    return NextResponse.json({ error: "createdByEmail is required." }, { status: 400 });
  }

  const creatorCheck = await resolveIdentifier(createdByEmail);
  if (!creatorCheck.ok || creatorCheck.role !== "intern") {
    return NextResponse.json(
      { error: "createdByEmail must belong to a hired intern." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("intern_work_logs")
    .insert({
      log_date: logDate,
      title,
      description,
      collaborated_with: collaboratedWith || null,
      progress_status: progressStatus,
      created_by_email: createdByEmail,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
