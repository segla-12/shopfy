import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "@/lib/supabaseAdmin";

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ message: "Content-Type must be multipart/form-data." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ message: "Only JPG, PNG, and WEBP images are supported." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ message: "Image is too large." }, { status: 413 });
  }

  try {
    const requestSupabase = createSupabaseRequestClient(request);
    const { data: authData, error: authError } = await requestSupabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const bucket = DEFAULT_BUCKET;
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "public, max-age=31536000",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ message: uploadError.message || "Image upload failed." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ message: "Failed to generate public image URL." }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Image upload failed." }, { status: 500 });
  }
}
