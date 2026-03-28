import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authenticateRequest, supabaseAdmin } from "../../_utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "text/plain",
  "text/csv",
  "application/zip",
];

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

/**
 * POST /api/interns/work-logs/upload
 * Accepts multipart/form-data with a single field "file".
 * Returns { url, name, type: "file", mimeType, size }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (auth.role === "admin") {
    return NextResponse.json(
      { error: "Admins cannot upload work log attachments" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be ≤ 10 MB" },
        { status: 400 }
      );
    }

    if (!isAllowedMime(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: images, PDF, Word docs, text, CSV, ZIP" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${auth.identifier}/${Date.now()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("work-log-attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[UPLOAD] Supabase storage error:", uploadError.message);
      return NextResponse.json(
        { error: uploadError.message || "Upload failed" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("work-log-attachments")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      attachment: {
        url: publicUrlData.publicUrl,
        name: file.name,
        type: "file",
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("[UPLOAD] Unexpected error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
