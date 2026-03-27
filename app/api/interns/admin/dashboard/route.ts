import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { supabaseAdmin, authenticateRequest } from "../../_utils";

type WorkLogRow = {
  id: string;
  log_date: string;
  work_mode?: string | null;
  progress_status: string;
  created_by_email: string;
  created_at: string;
};

type ReportRow = {
  id: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
};

type GamificationRow = {
  intern_email: string;
  total_points: number;
  current_streak: number;
  max_streak: number;
  work_logs_submitted: number;
  reports_resolved: number;
  badges?: string[];
  last_activity_date?: string;
};

type HiredInternRow = {
  full_name: string;
  email: string;
};

/**
 * GET /api/interns/admin/dashboard
 * Comprehensive admin dashboard with metrics, leaderboards, and analytics
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    // Fetch all metrics in parallel
    const [logsRes, reportsRes, gamificationRes, auditRes, hiredInternsRes] = await Promise.all([
      supabaseAdmin.from("intern_work_logs").select("*"),
      supabaseAdmin.from("intern_reports").select("*"),
      supabaseAdmin.from("intern_gamification").select("*"),
      supabaseAdmin.from("intern_admin_audit").select("*").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin
        .from("internship_applications")
        .select("full_name, email")
        .eq("status", "hired"),
    ]);

    const logs: WorkLogRow[] = (logsRes.data || []) as WorkLogRow[];
    const reports: ReportRow[] = (reportsRes.data || []) as ReportRow[];
    const gamifications: GamificationRow[] = (gamificationRes.data || []) as GamificationRow[];
    const audits = auditRes.data || [];
    const hiredInterns: HiredInternRow[] = (hiredInternsRes.data || []) as HiredInternRow[];

    // Calculate metrics
    const totalLogs = logs.length;
    const totalReports = reports.length;
    const openReports = reports.filter((r: ReportRow) => r.status === "open").length;
    const inProgressReports = reports.filter((r: ReportRow) => r.status === "in_progress").length;
    const blockedLogs = logs.filter((l: WorkLogRow) => l.progress_status === "blocked").length;
    const completedLogs = logs.filter((l: WorkLogRow) => l.progress_status === "completed").length;

    const today = new Date().toISOString().split("T")[0];
    const submittedTodayEmails = new Set(
      logs
        .filter((log) => log.log_date === today)
        .map((log) => String(log.created_by_email || "").toLowerCase())
    );

    const missedWorklogToday = hiredInterns
      .filter((intern: HiredInternRow) => !submittedTodayEmails.has(String(intern.email || "").toLowerCase()))
      .map((intern: HiredInternRow) => ({
        fullName: intern.full_name,
        email: intern.email,
      }));

    const workModeDistribution = {
      onsite: logs.filter((l: WorkLogRow) => String(l.work_mode || "onsite").toLowerCase() === "onsite").length,
      wfh: logs.filter((l: WorkLogRow) => String(l.work_mode || "onsite").toLowerCase() === "wfh").length,
    };

    // Leaderboard (top 10 by points)
    const leaderboard = gamifications
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 10)
      .map((g: GamificationRow) => ({
        email: g.intern_email,
        points: g.total_points,
        streak: g.current_streak,
        maxStreak: g.max_streak,
        logsSubmitted: g.work_logs_submitted,
        reportsResolved: g.reports_resolved,
        badges: g.badges,
      }));

    // Recent activity
    const recentActivity = audits.slice(0, 15);

    // Status distribution
    const statusDistribution = {
      openReports,
      inProgressReports,
      resolvedReports: reports.filter((r: ReportRow) => r.status === "resolved").length,
      closedReports: reports.filter((r: ReportRow) => r.status === "closed").length,
      submittedLogs: logs.filter((l: WorkLogRow) => l.progress_status === "submitted").length,
      inProgressLogs: logs.filter((l: WorkLogRow) => l.progress_status === "in_progress").length,
      completedLogs,
      blockedLogs,
      reviewedLogs: logs.filter((l: WorkLogRow) => l.progress_status === "reviewed").length,
    };

    // Priority distribution
    const priorityDistribution = {
      critical: reports.filter((r: ReportRow) => r.priority === "critical").length,
      high: reports.filter((r: ReportRow) => r.priority === "high").length,
      medium: reports.filter((r: ReportRow) => r.priority === "medium").length,
      low: reports.filter((r: ReportRow) => r.priority === "low").length,
    };

    // Category distribution
    const categoryDistribution = {
      bug: reports.filter((r: ReportRow) => r.category === "bug").length,
      problem: reports.filter((r: ReportRow) => r.category === "problem").length,
    };

    // Timeline data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      return {
        date: dateStr,
        logsSubmitted: logs.filter((l: WorkLogRow) => l.created_at.startsWith(dateStr)).length,
        reportsSubmitted: reports.filter((r: ReportRow) => r.created_at.startsWith(dateStr)).length,
      };
    });

    return NextResponse.json({
      metrics: {
        totalLogs,
        totalReports,
        totalInterns: gamifications.length,
        activeToday: gamifications.filter(
          (g: GamificationRow) => g.last_activity_date === new Date().toISOString().split("T")[0]
        ).length,
      },
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      leaderboard,
      recentActivity,
      timeline: last7Days,
      workModeDistribution,
      missedWorklogToday,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
