import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 80);
}

function getDateFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppUser();
    if (!profile || !["admin", "ehs", "action_owner"].includes(profile.appUser.role)) {
      return NextResponse.json({ ok: false, error: "Action owner or EHS login is required to upload closure evidence." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Closure evidence photo is required." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ ok: false, error: "Selected closure evidence photo is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: "Closure evidence photo is too large. Maximum allowed size is 5 MB." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Only JPG, PNG, WEBP, HEIC, or HEIF photos are allowed." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const bucket = process.env.SUPABASE_HAZARD_PHOTOS_BUCKET || "hazard-photos";
    const safeName = sanitizeFileName(file.name) || "closure-evidence.jpg";
    const storagePath = `actions/${getDateFolder()}/${crypto.randomUUID()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage.from(bucket).upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false
    });

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Closure evidence upload to Supabase Storage failed." },
        { status: 500 }
      );
    }

    const { data: signedUrlData } = await supabase.storage.from(bucket).createSignedUrl(data.path, 60 * 60);

    return NextResponse.json({
      ok: true,
      provider: "supabase",
      bucket,
      path: data.path,
      signedUrl: signedUrlData?.signedUrl ?? null,
      originalFileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown closure evidence upload error." },
      { status: 500 }
    );
  }
}
