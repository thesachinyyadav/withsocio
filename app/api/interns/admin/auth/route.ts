import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, normalizeIdentifier, isValidEmail, verifyAdminCredentials, hashPassword } from "../../_utils";

/**
 * Admin Login Endpoint
 * POST /api/interns/admin/auth
 * 
 * Request body:
 * {
 *   "email": "admin@socio.tech",
 *   "password": "secure_password"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "role": "admin",
 *   "token": "admin@socio.tech",
 *   "user": {
 *     "id": "uuid",
 *     "email": "admin@socio.tech",
 *     "fullName": "Admin Name",
 *     "role": "super_admin" | "admin"
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify credentials
    const adminUser = await verifyAdminCredentials(email, password);

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: "Admin account is inactive" },
        { status: 403 }
      );
    }

    // Return session token
    return NextResponse.json({
      success: true,
      role: "admin",
      token: adminUser.email,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Verify Admin Token (Optional - for frontend session validation)
 * GET /api/interns/admin/auth
 * Headers: x-interns-token: admin@socio.tech
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("x-interns-token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const normalized = normalizeIdentifier(token);

    const { data: adminUser, error } = await supabaseAdmin
      .from("intern_admin_users")
      .select("*")
      .ilike("email", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
