import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getAdminPassword = () => process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return Boolean(headerPassword && headerPassword === getAdminPassword());
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isToday = (value?: string | null) => {
  if (!value) return false;
  const today = new Date().toISOString().split("T")[0];
  return String(value).startsWith(today);
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [accountsRes, applicantsRes, logsRes, reportsRes, mailboxStateRes, mailboxNotificationsRes] = await Promise.all([
      supabaseAdmin.from("accounts_expenses").select("status,total_amount,created_at"),
      supabaseAdmin.from("internship_applications").select("status,campus_id,created_at"),
      supabaseAdmin.from("intern_work_logs").select("progress_status,created_at"),
      supabaseAdmin.from("intern_reports").select("status,priority,created_at"),
      supabaseAdmin.from("mailbox_email_state").select("is_read,is_starred,updated_at"),
      supabaseAdmin
        .from("mailbox_notification_log")
        .select("received_at", { count: "exact" })
        .order("received_at", { ascending: false })
        .limit(1),
    ]);

    const responses = [
      accountsRes,
      applicantsRes,
      logsRes,
      reportsRes,
      mailboxStateRes,
      mailboxNotificationsRes,
    ];

    const failed = responses.find((response) => response.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    const accountsRows = accountsRes.data || [];
    const applicantsRows = applicantsRes.data || [];
    const logsRows = logsRes.data || [];
    const reportsRows = reportsRes.data || [];
    const mailboxStateRows = mailboxStateRes.data || [];
    const mailboxLatest = mailboxNotificationsRes.data?.[0] || null;

    let pendingAmount = 0;
    let purchasedAmount = 0;
    let settledAmount = 0;
    let pendingCount = 0;
    let purchasedCount = 0;
    let settledCount = 0;

    for (const row of accountsRows) {
      const amount = toNumber((row as { total_amount?: unknown }).total_amount);
      const status = String((row as { status?: string }).status || "");

      if (status === "pending_approval") {
        pendingAmount += amount;
        pendingCount += 1;
      } else if (status === "purchased") {
        purchasedAmount += amount;
        purchasedCount += 1;
      } else if (status === "settled") {
        settledAmount += amount;
        settledCount += 1;
      }
    }

    const applicantStatuses = {
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      hired: 0,
      alumni: 0,
      rejected: 0,
    };

    let christidApplicants = 0;
    let applicantsToday = 0;
    const campuses = new Set<string>();

    for (const row of applicantsRows) {
      const status = String((row as { status?: string }).status || "").toLowerCase();
      const campusId = String((row as { campus_id?: string }).campus_id || "").toLowerCase();

      if (status in applicantStatuses) {
        applicantStatuses[status as keyof typeof applicantStatuses] += 1;
      }

      if (campusId) campuses.add(campusId);
      if (campusId === "christid") christidApplicants += 1;
      if (isToday((row as { created_at?: string }).created_at)) applicantsToday += 1;
    }

    const logStatuses = {
      submitted: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
      reviewed: 0,
    };

    let logsToday = 0;

    for (const row of logsRows) {
      const status = String((row as { progress_status?: string }).progress_status || "").toLowerCase();
      if (status in logStatuses) {
        logStatuses[status as keyof typeof logStatuses] += 1;
      }
      if (isToday((row as { created_at?: string }).created_at)) logsToday += 1;
    }

    const reportStatuses = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    const reportPriorities = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let reportsToday = 0;

    for (const row of reportsRows) {
      const status = String((row as { status?: string }).status || "").toLowerCase();
      const priority = String((row as { priority?: string }).priority || "").toLowerCase();

      if (status in reportStatuses) {
        reportStatuses[status as keyof typeof reportStatuses] += 1;
      }

      if (priority in reportPriorities) {
        reportPriorities[priority as keyof typeof reportPriorities] += 1;
      }

      if (isToday((row as { created_at?: string }).created_at)) reportsToday += 1;
    }

    const trackedMailboxEmails = mailboxStateRows.length;
    const readMailboxEmails = mailboxStateRows.filter((row) => Boolean((row as { is_read?: boolean }).is_read)).length;
    const unreadMailboxEmails = trackedMailboxEmails - readMailboxEmails;
    const starredMailboxEmails = mailboxStateRows.filter((row) => Boolean((row as { is_starred?: boolean }).is_starred)).length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      accounts: {
        totalExpenses: accountsRows.length,
        totalAmount: accountsRows.reduce(
          (sum, row) => sum + toNumber((row as { total_amount?: unknown }).total_amount),
          0
        ),
        pendingApprovalCount: pendingCount,
        purchasedCount,
        settledCount,
        pendingApprovalAmount: pendingAmount,
        purchasedAmount,
        settledAmount,
        pendingClearanceAmount: pendingAmount + purchasedAmount,
      },
      careers: {
        totalApplicants: applicantsRows.length,
        applicantsToday,
        campusCount: campuses.size,
        christidApplicants,
        statuses: applicantStatuses,
      },
      interns: {
        totalWorkLogs: logsRows.length,
        workLogsToday: logsToday,
        totalReports: reportsRows.length,
        reportsToday,
        logStatuses,
        reportStatuses,
        reportPriorities,
      },
      mailbox: {
        receivedNotifications: mailboxNotificationsRes.count || 0,
        trackedEmails: trackedMailboxEmails,
        readEmails: readMailboxEmails,
        unreadEmails: unreadMailboxEmails,
        starredEmails: starredMailboxEmails,
        lastNotificationAt: mailboxLatest ? (mailboxLatest as { received_at?: string }).received_at || null : null,
      },
    });
  } catch (error) {
    console.error("[ADMIN_OVERVIEW] Failed to build overview", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
