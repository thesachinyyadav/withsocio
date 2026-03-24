import { NextResponse } from "next/server";
import { authenticateRequest, supabaseAdmin } from "../../_utils";

type ActivityRow = {
  id: string;
  type: "work_log" | "report";
  title: string;
  status: string;
  createdByEmail: string;
  createdAt: string;
};

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const [
    totalLogsResult,
    totalReportsResult,
    openReportsResult,
    blockedLogsResult,
    recentLogsResult,
    recentReportsResult,
  ] = await Promise.all([
    supabaseAdmin.from("intern_work_logs").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("intern_reports").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("intern_reports")
      .select("id", { count: "exact", head: true })
      .in("work_status", ["open", "in_progress"]),
    supabaseAdmin
      .from("intern_work_logs")
      .select("id", { count: "exact", head: true })
      .eq("progress_status", "blocked"),
    supabaseAdmin
      .from("intern_work_logs")
      .select("id, title, progress_status, created_by_email, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("intern_reports")
      .select("id, title, work_status, created_by_email, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const firstError = [
    totalLogsResult,
    totalReportsResult,
    openReportsResult,
    blockedLogsResult,
    recentLogsResult,
    recentReportsResult,
  ].find((result) => result.error);

  if (firstError?.error) {
    return NextResponse.json({ error: firstError.error.message }, { status: 500 });
  }

  const logActivity: ActivityRow[] = (recentLogsResult.data || []).map((row) => ({
    id: row.id,
    type: "work_log",
    title: row.title,
    status: row.progress_status,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  }));

  const reportActivity: ActivityRow[] = (recentReportsResult.data || []).map((row) => ({
    id: row.id,
    type: "report",
    title: row.title,
    status: row.work_status,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  }));

  const recentActivity = [...logActivity, ...reportActivity]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return NextResponse.json({
    totals: {
      totalLogs: totalLogsResult.count || 0,
      totalReports: totalReportsResult.count || 0,
      openReports: openReportsResult.count || 0,
      blockedLogs: blockedLogsResult.count || 0,
    },
    recentActivity,
  });
}
