import { NextResponse } from "next/server";
import { z } from "zod";
import { getActionOwnerIdForUser, getCurrentAppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const closurePhotoSchema = z.object({
  provider: z.literal("supabase"),
  bucket: z.string().trim().min(1),
  path: z.string().trim().min(1),
  signedUrl: z.string().trim().optional().nullable(),
  originalFileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive()
});

const actionUpdateSchema = z.object({
  assignmentId: z.string().uuid(),
  status: z.enum(["in_progress", "pending_verification"]),
  comment: z.string().trim().min(3, "Comment is required.").max(2000),
  updatedByUserId: z.string().uuid().optional().nullable(),
  closurePhoto: closurePhotoSchema.optional().nullable()
});

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppUser();
    if (!profile || !["admin", "ehs", "action_owner"].includes(profile.appUser.role)) {
      return NextResponse.json({ ok: false, error: "Action owner or EHS login is required." }, { status: 403 });
    }

    const payload = actionUpdateSchema.parse(await request.json());
    const updatedByUserId = profile.appUser.id;
    const supabase = createSupabaseAdmin();

    if (payload.status === "pending_verification" && !payload.closurePhoto) {
      return NextResponse.json({ ok: false, error: "Closure evidence photo is required before EHS verification." }, { status: 400 });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("report_assignments")
      .select("id, report_id, action_owner_id, status")
      .eq("id", payload.assignmentId)
      .maybeSingle();

    if (assignmentError) {
      return NextResponse.json({ ok: false, error: assignmentError.message }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ ok: false, error: "Assignment not found." }, { status: 404 });
    }

    if (profile.appUser.role === "action_owner") {
      const currentOwnerId = await getActionOwnerIdForUser(profile.appUser.id);
      if (!currentOwnerId || assignment.action_owner_id !== currentOwnerId) {
        return NextResponse.json({ ok: false, error: "This action is not assigned to your action owner profile." }, { status: 403 });
      }
    }

    if (["closed", "cancelled"].includes(assignment.status)) {
      return NextResponse.json({ ok: false, error: "This assignment is already closed or cancelled." }, { status: 409 });
    }

    const { data: report, error: reportError } = await supabase
      .from("hazard_reports")
      .select("id, report_no, status")
      .eq("id", assignment.report_id)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ ok: false, error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ ok: false, error: "Linked report not found." }, { status: 404 });
    }

    if (["closed", "cancelled"].includes(report.status)) {
      return NextResponse.json({ ok: false, error: "This report is already closed or cancelled." }, { status: 409 });
    }

    let closurePhotoId: string | null = null;

    if (payload.status === "pending_verification" && payload.closurePhoto) {
      const { data: closurePhoto, error: closurePhotoError } = await supabase
        .from("hazard_photos")
        .insert({
          report_id: report.id,
          storage_provider: "supabase",
          supabase_bucket: payload.closurePhoto.bucket,
          supabase_storage_path: payload.closurePhoto.path,
          original_file_name: payload.closurePhoto.originalFileName,
          mime_type: payload.closurePhoto.mimeType,
          size_bytes: payload.closurePhoto.sizeBytes,
          cloudinary_public_id: null,
          cloudinary_url: null,
          photo_type: "closure",
          uploaded_by_user_id: updatedByUserId
        })
        .select("id")
        .single();

      if (closurePhotoError || !closurePhoto) {
        return NextResponse.json(
          { ok: false, error: closurePhotoError?.message ?? "Closure photo record could not be saved." },
          { status: 500 }
        );
      }

      closurePhotoId = closurePhoto.id;
    }

    const nextReportStatus = payload.status === "pending_verification" ? "pending_verification" : "in_progress";
    const previousReportStatus = report.status;

    const { error: assignmentUpdateError } = await supabase
      .from("report_assignments")
      .update({ status: payload.status, updated_at: new Date().toISOString() })
      .eq("id", assignment.id);

    if (assignmentUpdateError) {
      return NextResponse.json({ ok: false, error: assignmentUpdateError.message }, { status: 500 });
    }

    const { error: reportUpdateError } = await supabase
      .from("hazard_reports")
      .update({ status: nextReportStatus, updated_at: new Date().toISOString() })
      .eq("id", report.id);

    if (reportUpdateError) {
      return NextResponse.json({ ok: false, error: reportUpdateError.message }, { status: 500 });
    }

    const { error: actionUpdateError } = await supabase.from("action_updates").insert({
      assignment_id: assignment.id,
      updated_by_user_id: updatedByUserId,
      status: payload.status,
      comment: payload.comment,
      closure_photo_id: closurePhotoId
    });

    if (actionUpdateError) {
      return NextResponse.json({ ok: false, error: actionUpdateError.message }, { status: 500 });
    }

    if (previousReportStatus !== nextReportStatus) {
      const { error: historyError } = await supabase.from("status_history").insert({
        report_id: report.id,
        old_status: previousReportStatus,
        new_status: nextReportStatus,
        changed_by_user_id: updatedByUserId,
        comment: payload.status === "pending_verification"
          ? "Action owner submitted closure evidence for EHS verification."
          : "Action owner updated the corrective action progress."
      });

      if (historyError) {
        return NextResponse.json({ ok: false, error: historyError.message }, { status: 500 });
      }
    }

    if (payload.status === "pending_verification") {
      const { data: primaryEhs } = await supabase
        .from("ehs_users")
        .select("user_id")
        .eq("is_primary_reviewer", true)
        .limit(1)
        .maybeSingle();

      await supabase.from("notifications").insert({
        report_id: report.id,
        recipient_type: "ehs",
        recipient_user_id: primaryEhs?.user_id ?? null,
        channel: "in_app",
        template_key: "action_pending_verification",
        message_preview: `${report.report_no} is ready for EHS verification with closure evidence.`,
        status: "pending"
      });
    }

    return NextResponse.json({
      ok: true,
      reportNo: report.report_no,
      assignmentId: assignment.id,
      assignmentStatus: payload.status,
      reportStatus: nextReportStatus,
      closurePhotoId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid action update request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown action update error." },
      { status: 500 }
    );
  }
}
