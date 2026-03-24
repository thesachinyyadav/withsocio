import { NextRequest, NextResponse } from "next/server";
import { ADMIN_IDENTIFIER } from "../../_utils";

/**
 * Admin Login Endpoint
 * POST /api/interns/admin/auth
 * 
 * Request body:
 * {
 *   "password": "socio2026"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "role": "admin",
 *   "token": "socio2026"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Simple password check
    if (password !== ADMIN_IDENTIFIER) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Return session token
    return NextResponse.json({
      success: true,
      role: "admin",
      token: ADMIN_IDENTIFIER,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Verify Admin Token (Optional - for frontend session validation)
 * GET /api/interns/admin/auth
 * Headers: x-interns-token: socio2026
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-interns-token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Simple token check
    if (token !== ADMIN_IDENTIFIER) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        role: "admin",
        email: "admin@socio.tech",
        fullName: "Admin"
      }
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
