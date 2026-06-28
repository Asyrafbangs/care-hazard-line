import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const verifySchema = z.object({
  reportNo: z.string().trim().min(1),
  assignmentId: z.string().uuid(),
  decision: z.enum(["close", "reopen"]),
  comment: z.string().trim().min(3, "Verification comment is required.").max(2000),
  verifiedByUserId: z.string().uuid().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = verifySchema.parse(await request.json());
    const supabase = createSupabaseAdmin();

    const { data: report, error: reportError } = await supabase
      .from("hazard_reports")
      .select("id, report_no, status, reporter_id")
      .eq("report_no", payload.reportNo)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ ok: false, error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("report_assignments")
      .select("id, report_id, action_owner_id, status")
      .eq("id", payload.assignmentId)
      .maybeSingle();

    if (assignmentError) {
      return NextResponse.json({ ok: false, error: assignmentError.message }, { status: 500 });
    }

    if (!assignment || assignment.report_id !== report.id) {
      return NextResponse.json({ ok: false, error: "Assignment not found for this report." }, { status: 404 });
    }

    if (payload.decision === "close" && assignment.status !== "pending_verification") {
      return NextResponse.json({ ok: false, error: "Only actions pending verification can be closed." }, { status: 409 });
    }

    if (["closed", "cancelled"].includes(report.status) && payload.decision === "close") {
      return NextResponse.json({ ok: false, error: "This report is already closed or cancelled." }, { status: 409 });
    }

    const nextStatus = payload.decision === "close" ? "closed" : "reopened";
    const previousReportStatus = report.status;
    const now = new Date().toISOString();

    const { error: assignmentUpdateError } = await supabase
      .from("report_assignments")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", assignment.id);

    if (assignmentUpdateError) {
      return NextResponse.json({ ok: false, error: assignmentUpdateError.message }, { status: 500 });
    }

    const reportUpdatePayload = payload.decision === "close"
      ? { status: "closed", closed_at: now, updated_at: now }
      : { status: "reopened", updated_at: now };

    const { error: reportUpdateError } = await supabase
      .from("hazard_reports")
      .update(reportUpdatePayload)
      .eq("id", report.id);

    if (reportUpdateError) {
      return NextResponse.json({ ok: false, error: reportUpdateError.message }, { status: 500 });
    }

    const { error: actionUpdateError } = await supabase.from("action_updates").insert({
      assignment_id: assignment.id,
      updated_by_user_id: payload.verifiedByUserId ?? null,
      status: nextStatus,
      comment: payload.comment,
      closure_photo_id: null
    });

    if (actionUpdateError) {
      return NextResponse.json({ ok: false, error: actionUpdateError.message }, { status: 500 });
    }

    const historyComment = payload.decision === "close"
      ? `EHS verified the closure evidence and closed the report. Comment: ${payload.comment}`
      : `EHS rejected the closure and reopened the action. Comment: ${payload.comment}`;

    const { error: historyError } = await supabase.from("status_history").insert({
      report_id: report.id,
      old_status: previousReportStatus,
      new_status: nextStatus,
      changed_by_user_id: payload.verifiedByUserId ?? null,
      comment: historyComment
    });

    if (historyError) {
      return NextResponse.json({ ok: false, error: historyError.message }, { status: 500 });
    }

    const notificationRows = payload.decision === "close"
      ? [
          {
            report_id: report.id,
            recipient_type: "reporter",
            recipient_reporter_id: report.reporter_id,
            recipient_user_id: null,
            channel: "in_app",
            template_key: "report_closed_update",
            message_preview: `${report.report_no} has been verified and closed by EHS.`,
            status: "pending"
          },
          {
            report_id: report.id,
            recipient_type: "action_owner",
            recipient_reporter_id: null,
            recipient_user_id: null,
            channel: "in_app",
            template_key: "action_verified_closed",
            message_preview: `${report.report_no} closure was accepted by EHS.`,
            status: "pending"
          }
        ]
      : [
          {
            report_id: report.id,
            recipient_type: "action_owner",
            recipient_reporter_id: null,
            recipient_user_id: null,
            channel: "in_app",
            template_key: "action_reopened_rework_required",
            message_preview: `${report.report_no} closure was not accepted. Rework is required.`,
            status: "pending"
          }
        ];

    await supabase.from("notifications").insert(notificationRows);

    return NextResponse.json({
      ok: true,
      reportNo: report.report_no,
      assignmentId: assignment.id,
      decision: payload.decision,
      status: nextStatus
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid verification request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown verification error." },
      { status: 500 }
    );
  }
}
