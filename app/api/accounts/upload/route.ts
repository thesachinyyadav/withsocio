import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { authenticateAccountsUser, supabaseAdmin } from "../_utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

function sanitizeFileName(name: string): string {
  return String(name || "receipt")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

export async function POST(request: NextRequest) {
  const auth = authenticateAccountsUser(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PNG, JPG, WEBP, or PDF." },
        { status: 400 }
      );
    }

    const safeName = sanitizeFileName(file.name);
    const storagePath = `${auth.user}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("accounts-expense-receipts")
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error:
            uploadError.message ||
            "Upload failed. Ensure the accounts-expense-receipts storage bucket exists.",
        },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("accounts-expense-receipts")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      file: {
        name: safeName,
        url: data.publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[ACCOUNTS] Upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
