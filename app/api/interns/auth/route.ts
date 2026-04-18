import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, resolveIdentifier, supabaseAdmin } from "../_utils";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (auth.role === "admin") {
    return NextResponse.json({
      success: true,
      role: "admin",
      user: {
        email: null,
        fullName: "SOCIO Admin",
      },
    });
  }

  const { data: intern } = await supabaseAdmin
    .from("internship_applications")
    .select("id, full_name, email, status")
    .ilike("email", auth.identifier)
    .in("status", ["hired", "alumni"])
    .maybeSingle();

  return NextResponse.json({
    success: true,
    role: "intern",
    user: {
      id: intern?.id,
      email: intern?.email || auth.identifier,
      fullName: intern?.full_name || "SOCIO Intern",
      status: intern?.status || "hired",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body?.identifier || "").trim();

  const resolved = await resolveIdentifier(identifier);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }

  if (resolved.role === "admin") {
    return NextResponse.json({
      success: true,
      role: "admin",
      token: resolved.identifier,
      user: {
        email: null,
        fullName: "SOCIO Admin",
      },
    });
  }

  return NextResponse.json({
    success: true,
    role: "intern",
    token: resolved.identifier,
    user: {
      id: resolved.intern.id,
      email: resolved.intern.email,
      fullName: resolved.intern.full_name,
      status: resolved.intern.status,
    },
  });
}
