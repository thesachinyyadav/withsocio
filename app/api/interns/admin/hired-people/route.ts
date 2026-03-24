import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, authenticateRequest, parsePage } from "../../../../_utils";

/**
 * GET /api/interns/admin/hired-people
 * Get list of all hired interns with their stats
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { safePage, safeLimit, from, to } = parsePage(searchParams);

    // Get all hired interns
    const { data: hired, error, count } = await supabaseAdmin
      .from("internship_applications")
      .select("*", { count: "exact" })
      .eq("status", "hired")
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enrich with gamification stats and work logs
    const enriched = await Promise.all(
      (hired || []).map(async (intern) => {
        const [gamRes, logsRes, reportsRes] = await Promise.all([
          supabaseAdmin
            .from("intern_gamification")
            .select("*")
            .eq("intern_email", intern.email)
            .maybeSingle(),
          supabaseAdmin
            .from("intern_work_logs")
            .select("id")
            .eq("created_by_email", intern.email),
          supabaseAdmin
            .from("intern_reports")
            .select("id")
            .eq("created_by_email", intern.email),
        ]);

        return {
          id: intern.id,
          fullName: intern.full_name,
          email: intern.email,
          roleInterest: intern.role_interest,
          portfolio: intern.portfolio_link,
          hoursPerWeek: intern.hours_per_week,
          points: gamRes.data?.total_points || 0,
          streak: gamRes.data?.current_streak || 0,
          logsSubmitted: logsRes.data?.length || 0,
          reportsSubmitted: reportsRes.data?.length || 0,
          joinedAt: intern.created_at,
        };
      })
    );

    return NextResponse.json({
      data: enriched,
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
