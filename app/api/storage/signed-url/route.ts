import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const signedUrlSchema = z.object({
  reportNo: z.string().trim().min(1),
  photoId: z.string().uuid().optional().nullable(),
  photoType: z.enum(["hazard", "closure", "verification"]).default("hazard"),
  viewerRole: z.enum(["ehs", "action_owner"]).default("ehs")
});

const SIGNED_URL_EXPIRY_SECONDS = 5 * 60;

export async function POST(request: Request) {
  try {
    const payload = signedUrlSchema.parse(await request.json());
    const supabase = createSupabaseAdmin();

    // Phase 2C uses a role flag only because full Supabase Auth role enforcement starts later.
    // The important privacy rule is still maintained in the selected view:
    // - ehs_report_detail includes reporter details.
    // - action_owner_report_detail excludes reporter name and phone number.
    const viewName = payload.viewerRole === "ehs" ? "ehs_report_detail" : "action_owner_report_detail";

    const { data: report, error: reportError } = await supabase
      .from(viewName)
      .select("id, report_no")
      .eq("report_no", payload.reportNo)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ ok: false, error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found or not visible to this role." }, { status: 404 });
    }

    let photoQuery = supabase
      .from("hazard_photos")
      .select("id, storage_provider, supabase_bucket, supabase_storage_path, original_file_name, mime_type, size_bytes, photo_type")
      .eq("report_id", report.id)
      .eq("storage_provider", "supabase")
      .not("supabase_bucket", "is", null)
      .not("supabase_storage_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (payload.photoId) {
      photoQuery = photoQuery.eq("id", payload.photoId);
    } else {
      photoQuery = photoQuery.eq("photo_type", payload.photoType);
    }

    const { data: photoRows, error: photoError } = await photoQuery;

    if (photoError) {
      return NextResponse.json({ ok: false, error: photoError.message }, { status: 500 });
    }

    const photo = photoRows?.[0];

    if (!photo?.supabase_bucket || !photo?.supabase_storage_path) {
      return NextResponse.json({ ok: false, error: "No stored Supabase photo found for this report." }, { status: 404 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(photo.supabase_bucket)
      .createSignedUrl(photo.supabase_storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signedUrlError?.message ?? "Could not create signed photo URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      signedUrl: signedUrlData.signedUrl,
      expiresInSeconds: SIGNED_URL_EXPIRY_SECONDS,
      fileName: photo.original_file_name,
      mimeType: photo.mime_type,
      sizeBytes: photo.size_bytes,
      photoType: photo.photo_type
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid signed URL request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown signed URL error." },
      { status: 500 }
    );
  }
}
