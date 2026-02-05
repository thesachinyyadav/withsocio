import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const applicantId = searchParams.get("applicantId");

  if (!applicantId) {
    return NextResponse.json({ error: "Missing applicantId" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("interview_scores")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { applicantId, interviewer, scores } = body || {};

  if (!applicantId || !interviewer || !scores) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const communication = Number(scores.communication || 0);
  const technicalDepth = Number(scores.technicalDepth || 0);
  const problemSolving = Number(scores.problemSolving || 0);
  const cultureFit = Number(scores.cultureFit || 0);
  const ownership = Number(scores.ownership || 0);

  const total =
    communication + technicalDepth + problemSolving + cultureFit + ownership;

  const { error } = await supabaseAdmin
    .from("interview_scores")
    .upsert(
      {
        applicant_id: applicantId,
        interviewer,
        communication,
        technical_depth: technicalDepth,
        problem_solving: problemSolving,
        culture_fit: cultureFit,
        ownership,
        total,
      },
      { onConflict: "applicant_id,interviewer" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
