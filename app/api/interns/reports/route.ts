import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  supabaseAdmin,
  authenticateRequest,
  parsePage,
  toSafeSearch,
  createAuditLog,
  awardPoints,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
} from "../_utils";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { safePage, safeLimit, from, to } = parsePage(searchParams);
    const search = searchParams.get("search") || searchParams.get("q");
    const safeSearch = search ? toSafeSearch(search).toLowerCase() : "";

    let query = supabaseAdmin
      .from("intern_reports")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filters
    const category = searchParams.get("category");
    if (category && REPORT_CATEGORIES.includes(category as any)) {
      query = query.eq("category", category);
    }

    const status = searchParams.get("status");
    if (status && REPORT_STATUSES.includes(status as any)) {
      query = query.eq("status", status);
    }

    const priority = searchParams.get("priority");
    if (priority && REPORT_PRIORITIES.includes(priority as any)) {
      query = query.eq("priority", priority);
    }

    const email = searchParams.get("email");
    if (email) {
      query = query.ilike("created_by_email", email);
    }

    const dateFrom = searchParams.get("dateFrom") || searchParams.get("from");
    const dateTo = searchParams.get("dateTo") || searchParams.get("to");
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

    if (!safeSearch) {
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    // Enrich with author names
    const enrichedReports = await Promise.all(
      (data || []).map(async (report) => {
        const { data: author } = await supabaseAdmin
          .from("internship_applications")
          .select("full_name")
          .eq("email", report.created_by_email)
          .maybeSingle();

        return {
          ...report,
          created_by_name: author?.full_name || "Unknown",
        };
      })
    );

    if (safeSearch) {
      const matches = enrichedReports.filter((report) => {
        const searchable = [
          report.title,
          report.details,
          report.category,
          report.created_by_name,
          report.created_by_email,
          ...(report.assigned_to_emails || []),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(safeSearch);
      });

      return NextResponse.json({
        data: matches,
        pagination: {
          page: 1,
          limit: matches.length || 1,
          total: matches.length,
          pages: 1,
        },
      });
    }

    return NextResponse.json({
      data: enrichedReports,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
        pages: Math.ceil((count || 0) / safeLimit),
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (auth.role === "admin") {
    return NextResponse.json(
      { error: "Admins cannot submit reports" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { category, title, details, priority, attachments, workStatus } = body;

    // Validation
    if (!category || !title || !details) {
      return NextResponse.json(
        { error: "category, title, and details are required" },
        { status: 400 }
      );
    }

    if (!REPORT_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "category must be 'bug' or 'problem'" },
        { status: 400 }
      );
    }

    if (title.length > 180) {
      return NextResponse.json(
        { error: "Title must be ≤ 180 characters" },
        { status: 400 }
      );
    }

    if (details.length > 5000) {
      return NextResponse.json(
        { error: "Details must be ≤ 5000 characters" },
        { status: 400 }
      );
    }

    if (priority && !REPORT_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // Verify reporter is hired intern
    const { data: reporter } = await supabaseAdmin
      .from("internship_applications")
      .select("id, full_name, email")
      .eq("email", auth.identifier)
      .eq("status", "hired")
      .maybeSingle();

    if (!reporter) {
      return NextResponse.json(
        { error: "Only hired interns can submit reports" },
        { status: 403 }
      );
    }

    // Create report
    const initialStatus =
      workStatus && REPORT_STATUSES.includes(workStatus) ? workStatus : "open";

    const { data: report, error } = await supabaseAdmin
      .from("intern_reports")
      .insert({
        category,
        title,
        details,
        status: initialStatus,
        priority: priority || "medium",
        created_by_email: auth.identifier,
        attachments: attachments || [],
        assigned_to_emails: [],
      })
      .select()
      .single();

    if (error) throw error;

    // Award points
    await awardPoints(auth.identifier, 5, "report_submitted");

    // Audit log
    await createAuditLog({
      actorEmail: auth.identifier,
      action: "REPORT_CREATED",
      targetType: "report",
      targetId: report.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...report,
          created_by_name: reporter.full_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
