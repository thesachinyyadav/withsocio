
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getAdminPassword = () =>
  process.env.ADMIN_DASHBOARD_PASSWORD || "socio2026";

const isAuthorized = (request: Request) => {
  const headerPassword = request.headers.get("x-admin-password");
  return headerPassword && headerPassword === getAdminPassword();
};

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${str}"`;
};


export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  // Excel export: /api/admin/export?format=xlsx
  if (format === "xlsx") {
    const { data, error } = await supabaseAdmin
      .from("internship_applications")
      .select("full_name,role_interest,status")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applicants");
    worksheet.columns = [
      { header: "Name", key: "full_name", width: 30 },
      { header: "Applied Role", key: "role_interest", width: 25 },
      { header: "Status", key: "status", width: 15 },
    ];
    (data || []).forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=applicants_export.xlsx`,
      },
    });
  }

  // Default: CSV export (legacy)
  const preference = searchParams.get("preference") || "";
  if (!preference) {
    return NextResponse.json({ error: "Missing preference" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("internship_applications")
    .select("*")
    .or(`preference1.eq.${preference},preference2.eq.${preference}`)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = data || [];
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const csvLines = [headers.join(",")];
  for (const row of rows) {
    const line = headers.map((key) => csvEscape((row as Record<string, unknown>)[key])).join(",");
    csvLines.push(line);
  }
  const csv = csvLines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=applicants_${preference.toLowerCase()}.csv`,
    },
  });
}
