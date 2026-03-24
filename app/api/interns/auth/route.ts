import { NextResponse } from "next/server";
import { resolveIdentifier } from "../_utils";

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
        fullName: "Interns Admin",
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
    },
  });
}
