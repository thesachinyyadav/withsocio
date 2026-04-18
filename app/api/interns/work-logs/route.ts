import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  supabaseAdmin,
  authenticateRequest,
  parsePage,
  toSafeSearch,
  createAuditLog,
  awardPoints,
  updateStreak,
  WORK_LOG_STATUSES,
} from "../_utils";

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(value: string): number | null {
  const match = TIME_24H_REGEX.exec(String(value || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { safePage, safeLimit, from, to } = parsePage(searchParams);
    const includeAll = searchParams.get("includeAll") === "true";

    let query = supabaseAdmin
      .from("intern_work_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (auth.role === "intern") {
      const shouldRestrictToSelf = auth.intern.status === "alumni" || !includeAll;
      if (shouldRestrictToSelf) {
        query = query.eq("created_by_email", auth.identifier);
      }
    }

    // Filters
    const status = searchParams.get("status");
    if (status && WORK_LOG_STATUSES.includes(status as any)) {
      query = query.eq("progress_status", status);
    }

    const email = searchParams.get("email");
    if (email) {
      query = query.ilike("created_by_email", email);
    }

    const dateFrom = searchParams.get("dateFrom") || searchParams.get("from");
    const dateTo = searchParams.get("dateTo") || searchParams.get("to");
    if (dateFrom) query = query.gte("log_date", dateFrom);
    if (dateTo) query = query.lte("log_date", dateTo);

    const search = searchParams.get("search") || searchParams.get("q");
    if (search) {
      const safe = toSafeSearch(search);
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%`
      );
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    // Enrich with intern names and developer list
    const response = await Promise.all(
      (data || []).map(async (log) => {
        const { data: intern } = await supabaseAdmin
          .from("internship_applications")
          .select("full_name")
          .eq("email", log.created_by_email)
          .maybeSingle();

        return {
          ...log,
          created_by_name: intern?.full_name || "Unknown",
        };
      })
    );

    return NextResponse.json({
      data: response,
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

  try {
    if (auth.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot submit work logs" },
        { status: 403 }
      );
    }

    if (auth.intern.status === "alumni") {
      return NextResponse.json(
        { error: "Alumni access is read-only. New work logs are disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      logDate,
      workMode,
      title,
      description,
      collaboratorEmails,
      attachments,
      workStartTime,
      workEndTime,
    } = body;

    // Validation
    if (!logDate || !title || !description) {
      return NextResponse.json(
        { error: "logDate, title, and description are required" },
        { status: 400 }
      );
    }

    const normalizedWorkMode = String(workMode || "onsite").trim().toLowerCase();
    if (!["wfh", "onsite"].includes(normalizedWorkMode)) {
      return NextResponse.json(
        { error: "workMode must be either 'wfh' or 'onsite'" },
        { status: 400 }
      );
    }

    if (title.length > 180) {
      return NextResponse.json(
        { error: "Title must be ≤ 180 characters" },
        { status: 400 }
      );
    }

    if (description.length > 4000) {
      return NextResponse.json(
        { error: "Description must be ≤ 4000 characters" },
        { status: 400 }
      );
    }

    // Verify creator is an active hired intern
    const { data: creator } = await supabaseAdmin
      .from("internship_applications")
      .select("id, full_name, email")
      .eq("email", auth.identifier)
      .eq("status", "hired")
      .maybeSingle();

    if (!creator) {
      return NextResponse.json(
        { error: "Only hired interns can submit work logs" },
        { status: 403 }
      );
    }

    // Validate and calculate hours from HH:mm inputs.
    let totalHours = null;
    let normalizedWorkStartTime: string | null = null;
    let normalizedWorkEndTime: string | null = null;

    const hasStartTime = Boolean(workStartTime);
    const hasEndTime = Boolean(workEndTime);

    if (hasStartTime !== hasEndTime) {
      return NextResponse.json(
        { error: "Please provide both start and end time." },
        { status: 400 }
      );
    }

    if (hasStartTime && hasEndTime) {
      const startMinutes = parseTimeToMinutes(workStartTime);
      const endMinutes = parseTimeToMinutes(workEndTime);

      if (startMinutes === null || endMinutes === null) {
        return NextResponse.json(
          { error: "Time must be in HH:mm format." },
          { status: 400 }
        );
      }

      if (endMinutes <= startMinutes) {
        return NextResponse.json(
          { error: "End time must be later than start time." },
          { status: 400 }
        );
      }

      const durationMinutes = endMinutes - startMinutes;
      totalHours = Math.round((durationMinutes / 60) * 100) / 100;
      normalizedWorkStartTime = new Date(`${logDate}T${workStartTime}:00`).toISOString();
      normalizedWorkEndTime = new Date(`${logDate}T${workEndTime}:00`).toISOString();
    }

    // Create work log
    const { data: workLog, error } = await supabaseAdmin
      .from("intern_work_logs")
      .insert({
        log_date: logDate,
        work_mode: normalizedWorkMode,
        title,
        description,
        collaborator_emails: collaboratorEmails || [],
        progress_status: "submitted",
        created_by_email: auth.identifier,
        attachments: attachments || [],
        work_start_time: normalizedWorkStartTime,
        work_end_time: normalizedWorkEndTime,
        total_hours: totalHours,
      })
      .select()
      .single();

    if (error) throw error;

    // Award points
    await awardPoints(auth.identifier, 10, "work_log_submitted");
    await updateStreak(auth.identifier);

    // Audit log
    await createAuditLog({
      actorEmail: auth.identifier,
      action: "WORK_LOG_CREATED",
      targetType: "work_log",
      targetId: workLog.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...workLog,
          created_by_name: creator.full_name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create error:", error);
    const message = error?.message || "Internal server error";
    // Check for unique violation on date
    if (error?.code === "23505") {
      return NextResponse.json({ error: "You have already submitted a work log for this date." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
