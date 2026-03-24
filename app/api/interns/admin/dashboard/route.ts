import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, authenticateRequest } from "../../_utils";

/**
 * GET /api/interns/admin/dashboard
 * Comprehensive admin dashboard with metrics, leaderboards, and analytics
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) return auth.response;

  try {
    // Fetch all metrics in parallel
    const [logsRes, reportsRes, gamificationRes, auditRes] = await Promise.all([
      supabaseAdmin.from("intern_work_logs").select("*"),
      supabaseAdmin.from("intern_reports").select("*"),
      supabaseAdmin.from("intern_gamification").select("*"),
      supabaseAdmin.from("intern_admin_audit").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    const logs = logsRes.data || [];
    const reports = reportsRes.data || [];
    const gamifications = gamificationRes.data || [];
    const audits = auditRes.data || [];

    // Calculate metrics
    const totalLogs = logs.length;
    const totalReports = reports.length;
    const openReports = reports.filter((r) => r.status === "open").length;
    const inProgressReports = reports.filter((r) => r.status === "in_progress").length;
    const blockedLogs = logs.filter((l) => l.progress_status === "blocked").length;
    const completedLogs = logs.filter((l) => l.progress_status === "completed").length;

    // Leaderboard (top 10 by points)
    const leaderboard = gamifications
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 10)
      .map((g) => ({
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
      resolvedReports: reports.filter((r) => r.status === "resolved").length,
      closedReports: reports.filter((r) => r.status === "closed").length,
      submittedLogs: logs.filter((l) => l.progress_status === "submitted").length,
      inProgressLogs: logs.filter((l) => l.progress_status === "in_progress").length,
      completedLogs,
      blockedLogs,
      reviewedLogs: logs.filter((l) => l.progress_status === "reviewed").length,
    };

    // Priority distribution
    const priorityDistribution = {
      critical: reports.filter((r) => r.priority === "critical").length,
      high: reports.filter((r) => r.priority === "high").length,
      medium: reports.filter((r) => r.priority === "medium").length,
      low: reports.filter((r) => r.priority === "low").length,
    };

    // Category distribution
    const categoryDistribution = {
      bug: reports.filter((r) => r.category === "bug").length,
      problem: reports.filter((r) => r.category === "problem").length,
    };

    // Timeline data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      return {
        date: dateStr,
        logsSubmitted: logs.filter((l) => l.created_at.startsWith(dateStr)).length,
        reportsSubmitted: reports.filter((r) => r.created_at.startsWith(dateStr)).length,
      };
    });

    return NextResponse.json({
      metrics: {
        totalLogs,
        totalReports,
        totalInterns: gamifications.length,
        activeToday: gamifications.filter(
          (g) => g.last_activity_date === new Date().toISOString().split("T")[0]
        ).length,
      },
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      leaderboard,
      recentActivity,
      timeline: last7Days,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
