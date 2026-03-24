import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { authenticateRequest, csvEscape, supabaseAdmin, toSafeSearch } from "../../_utils";

type ExportKind = "work-logs" | "reports";

function normalizeKind(value: string): ExportKind {
  return value === "reports" ? "reports" : "work-logs";
}

function buildCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "xlsx").toLowerCase();
  const kind = normalizeKind((searchParams.get("kind") || "work-logs").toLowerCase());
  const status = (searchParams.get("status") || "").trim();
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const category = (searchParams.get("category") || "").trim();
  const priority = (searchParams.get("priority") || "").trim();
  const queryText = toSafeSearch(searchParams.get("q") || "");
  const fromDate = (searchParams.get("from") || "").trim();
  const toDate = (searchParams.get("to") || "").trim();

  if (!["csv", "xlsx"].includes(format)) {
    return NextResponse.json({ error: "format must be csv or xlsx" }, { status: 400 });
  }

  if (kind === "work-logs") {
    let query = supabaseAdmin.from("intern_work_logs").select("*");

    if (status) query = query.eq("progress_status", status);
    if (email) query = query.ilike("created_by_email", email);
    if (fromDate) query = query.gte("log_date", fromDate);
    if (toDate) query = query.lte("log_date", toDate);
    if (queryText) {
      query = query.or(
        `title.ilike.%${queryText}%,description.ilike.%${queryText}%,collaborated_with.ilike.%${queryText}%,created_by_email.ilike.%${queryText}%`
      );
    }

    const { data, error } = await query.order("log_date", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((row) => ({
      log_date: row.log_date,
      title: row.title,
      description: row.description,
      collaborated_with: row.collaborated_with,
      progress_status: row.progress_status,
      created_by_email: row.created_by_email,
      admin_notes: row.admin_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (format === "csv") {
      const csv = buildCsv(rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=intern_work_logs_export.csv",
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Work Logs");
    worksheet.columns = [
      { header: "Date", key: "log_date", width: 14 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Collaborated With", key: "collaborated_with", width: 30 },
      { header: "Status", key: "progress_status", width: 14 },
      { header: "Created By", key: "created_by_email", width: 28 },
      { header: "Admin Notes", key: "admin_notes", width: 30 },
      { header: "Created At", key: "created_at", width: 24 },
      { header: "Updated At", key: "updated_at", width: 24 },
    ];
    rows.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=intern_work_logs_export.xlsx",
      },
    });
  }

  let query = supabaseAdmin.from("intern_reports").select("*");

  if (status) query = query.eq("work_status", status);
  if (email) query = query.ilike("created_by_email", email);
  if (category) query = query.eq("category", category);
  if (priority) query = query.eq("priority", priority);
  if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00`);
  if (toDate) query = query.lte("created_at", `${toDate}T23:59:59`);
  if (queryText) {
    query = query.or(`title.ilike.%${queryText}%,details.ilike.%${queryText}%,created_by_email.ilike.%${queryText}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((row) => ({
    category: row.category,
    title: row.title,
    details: row.details,
    work_status: row.work_status,
    priority: row.priority,
    created_by_email: row.created_by_email,
    admin_notes: row.admin_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  if (format === "csv") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=intern_reports_export.csv",
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reports");
  worksheet.columns = [
    { header: "Category", key: "category", width: 12 },
    { header: "Title", key: "title", width: 30 },
    { header: "Details", key: "details", width: 50 },
    { header: "Status", key: "work_status", width: 14 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Created By", key: "created_by_email", width: 28 },
    { header: "Admin Notes", key: "admin_notes", width: 30 },
    { header: "Created At", key: "created_at", width: 24 },
    { header: "Updated At", key: "updated_at", width: 24 },
  ];
  rows.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=intern_reports_export.xlsx",
    },
  });
}
