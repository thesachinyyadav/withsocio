import { NextRequest, NextResponse } from "next/server";
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

    if (auth.role === "intern" && !includeAll) {
      query = query.eq("created_by_email", auth.identifier);
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

    // Future date validation — no entries allowed for future dates (IST)
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, "0")}-${String(nowIST.getDate()).padStart(2, "0")}`;
    if (logDate > todayStr) {
      return NextResponse.json(
        { error: "Cannot create work logs for future dates" },
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

    // Verify creator is a hired intern
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

    // Calculate hours from time strings (HH:MM format)
    let totalHours: number | null = null;
    let startTimestamp: string | null = null;
    let endTimestamp: string | null = null;

    if (workStartTime && workEndTime) {
      // workStartTime and workEndTime are "HH:MM" strings from <input type="time">
      const [startH, startM] = workStartTime.split(":").map(Number);
      const [endH, endM] = workEndTime.split(":").map(Number);

      if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const diffMinutes = endMinutes - startMinutes;

        if (diffMinutes > 0) {
          totalHours = Math.round((diffMinutes / 60) * 100) / 100;
        }

        // Build proper ISO timestamps using logDate + time
        startTimestamp = `${logDate}T${workStartTime}:00+05:30`;
        endTimestamp = `${logDate}T${workEndTime}:00+05:30`;
      }
    }

    // Sanitize attachments — ensure it's a valid array of objects
    const safeAttachments = Array.isArray(attachments)
      ? attachments.filter(
          (a: Record<string, unknown>) => a && typeof a.name === "string" && typeof a.url === "string"
        ).map((a: Record<string, unknown>) => ({
          name: String(a.name).slice(0, 255),
          url: String(a.url).slice(0, 2048),
          type: ["file", "drive_link", "image", "link"].includes(String(a.type)) ? String(a.type) : "link",
        }))
      : [];

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
        attachments: safeAttachments,
        work_start_time: startTimestamp,
        work_end_time: endTimestamp,
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
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
