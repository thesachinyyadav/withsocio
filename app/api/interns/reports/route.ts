import { NextResponse } from "next/server";
import {
  authenticateRequest,
  parsePage,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
  resolveIdentifier,
  supabaseAdmin,
  toSafeSearch,
} from "../_utils";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const { safePage, safeLimit, from, to } = parsePage(searchParams);
  const category = (searchParams.get("category") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const priority = (searchParams.get("priority") || "").trim();
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const queryText = toSafeSearch(searchParams.get("q") || "");
  const fromDate = (searchParams.get("from") || "").trim();
  const toDate = (searchParams.get("to") || "").trim();

  let query = supabaseAdmin.from("intern_reports").select("*", { count: "exact" });

  if (category) {
    query = query.eq("category", category);
  }

  if (status) {
    query = query.eq("work_status", status);
  }

  if (priority) {
    query = query.eq("priority", priority);
  }

  if (email) {
    query = query.ilike("created_by_email", email);
  }

  if (fromDate) {
    query = query.gte("created_at", `${fromDate}T00:00:00`);
  }

  if (toDate) {
    query = query.lte("created_at", `${toDate}T23:59:59`);
  }

  if (queryText) {
    query = query.or(
      `title.ilike.%${queryText}%,details.ilike.%${queryText}%,created_by_email.ilike.%${queryText}%`
    );
  }

  const { data, error, count } = await query
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
      categoryOptions: REPORT_CATEGORIES,
      statusOptions: REPORT_STATUSES,
      priorityOptions: REPORT_PRIORITIES,
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

  const category = String(body?.category || "").trim();
  const title = String(body?.title || "").trim();
  const details = String(body?.details || "").trim();
  const workStatus = String(body?.workStatus || "open").trim();
  const priority = String(body?.priority || "medium").trim();
  const createdByEmailInput = String(body?.createdByEmail || "").trim().toLowerCase();

  if (!category || !title || !details) {
    return NextResponse.json(
      { error: "category, title, and details are required." },
      { status: 400 }
    );
  }

  if (!REPORT_CATEGORIES.includes(category as (typeof REPORT_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (!REPORT_STATUSES.includes(workStatus as (typeof REPORT_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid workStatus." }, { status: 400 });
  }

  if (!REPORT_PRIORITIES.includes(priority as (typeof REPORT_PRIORITIES)[number])) {
    return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
  }

  if (title.length > 180) {
    return NextResponse.json({ error: "Title must be 180 characters or less." }, { status: 400 });
  }

  if (details.length > 5000) {
    return NextResponse.json({ error: "Details must be 5000 characters or less." }, { status: 400 });
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
    .from("intern_reports")
    .insert({
      category,
      title,
      details,
      work_status: workStatus,
      priority,
      created_by_email: createdByEmail,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
