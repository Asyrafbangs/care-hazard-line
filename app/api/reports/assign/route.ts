import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, isEhsRole } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const assignSchema = z.object({
  reportNo: z.string().trim().min(1),
  finalUrgency: z.enum(["low", "medium", "high", "urgent"]),
  finalCategoryId: z.string().uuid().optional().nullable(),
  actionOwnerId: z.string().uuid(),
  actionRequired: z.string().trim().min(5),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ehsComment: z.string().trim().optional().nullable(),
  assignedByUserId: z.string().uuid().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAppUser();
    if (!profile || !isEhsRole(profile.appUser.role)) {
      return NextResponse.json({ ok: false, error: "EHS role is required to assign reports." }, { status: 403 });
    }

    const payload = assignSchema.parse(await request.json());
    const assignedByUserId = profile.appUser.id;
    const supabase = createSupabaseAdmin();

    const { data: report, error: reportError } = await supabase
      .from("hazard_reports")
      .select("id, report_no, status, ai_hazard_summary, original_description")
      .eq("report_no", payload.reportNo)
      .maybeSingle();

    if (reportError) {
      throw new Error(reportError.message);
    }

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
    }

    const { data: actionOwner, error: ownerError } = await supabase
      .from("action_owners")
      .select("id, user_id, owner_level")
      .eq("id", payload.actionOwnerId)
      .maybeSingle();

    if (ownerError) {
      throw new Error(ownerError.message);
    }

    if (!actionOwner) {
      return NextResponse.json({ ok: false, error: "Action owner not found." }, { status: 400 });
    }

    let finalCategoryName: string | null = null;
    if (payload.finalCategoryId) {
      const { data: category, error: categoryError } = await supabase
        .from("hazard_categories")
        .select("id, name")
        .eq("id", payload.finalCategoryId)
        .maybeSingle();

      if (categoryError) {
        throw new Error(categoryError.message);
      }

      finalCategoryName = category?.name ?? null;
    }

    const { data: existingAssignment } = await supabase
      .from("report_assignments")
      .select("id, status")
      .eq("report_id", report.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let assignmentId: string | null = null;

    if (existingAssignment && !["closed", "cancelled"].includes(existingAssignment.status)) {
      const { data: updatedAssignment, error: assignmentUpdateError } = await supabase
        .from("report_assignments")
        .update({
          action_owner_id: payload.actionOwnerId,
          assigned_by_user_id: assignedByUserId,
          action_required: payload.actionRequired,
          due_date: payload.dueDate,
          status: "assigned",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingAssignment.id)
        .select("id")
        .single();

      if (assignmentUpdateError || !updatedAssignment) {
        throw new Error(assignmentUpdateError?.message ?? "Assignment could not be updated.");
      }

      assignmentId = updatedAssignment.id;
    } else {
      const { data: newAssignment, error: assignmentInsertError } = await supabase
        .from("report_assignments")
        .insert({
          report_id: report.id,
          action_owner_id: payload.actionOwnerId,
          assigned_by_user_id: assignedByUserId,
          action_required: payload.actionRequired,
          due_date: payload.dueDate,
          status: "assigned"
        })
        .select("id")
        .single();

      if (assignmentInsertError || !newAssignment) {
        throw new Error(assignmentInsertError?.message ?? "Assignment could not be created.");
      }

      assignmentId = newAssignment.id;
    }

    const { error: updateReportError } = await supabase
      .from("hazard_reports")
      .update({
        final_category_id: payload.finalCategoryId ?? null,
        final_urgency: payload.finalUrgency,
        status: "assigned",
        updated_at: new Date().toISOString()
      })
      .eq("id", report.id);

    if (updateReportError) {
      throw new Error(updateReportError.message);
    }

    const commentParts = [
      "EHS reviewed the report and assigned corrective action.",
      finalCategoryName ? `Final category: ${finalCategoryName}.` : null,
      `Final urgency: ${payload.finalUrgency}.`,
      payload.ehsComment ? `EHS comment: ${payload.ehsComment}` : null
    ].filter(Boolean);

    await supabase.from("status_history").insert({
      report_id: report.id,
      old_status: report.status,
      new_status: "assigned",
      changed_by_user_id: assignedByUserId,
      comment: commentParts.join(" ")
    });

    await supabase.from("notifications").insert({
      report_id: report.id,
      recipient_type: "action_owner",
      recipient_user_id: actionOwner.user_id,
      channel: "in_app",
      template_key: "hazard_action_assigned",
      message_preview: `Hazard action assigned for ${report.report_no}. Due date: ${payload.dueDate}.`,
      status: "pending"
    });

    if (["high", "urgent"].includes(payload.finalUrgency)) {
      const { data: ehsUsers } = await supabase.from("ehs_users").select("user_id");
      const rows = (ehsUsers ?? []).map((ehsUser) => ({
        report_id: report.id,
        recipient_type: "ehs",
        recipient_user_id: ehsUser.user_id,
        channel: "in_app",
        template_key: "high_risk_assignment_watch",
        message_preview: `${payload.finalUrgency.toUpperCase()} report ${report.report_no} has been assigned and needs close monitoring.`,
        status: "pending"
      }));

      if (rows.length > 0) {
        await supabase.from("notifications").insert(rows);
      }
    }

    return NextResponse.json({
      ok: true,
      reportNo: report.report_no,
      assignmentId,
      status: "assigned",
      finalUrgency: payload.finalUrgency,
      finalCategoryName
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid assignment data", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown assignment error" },
      { status: 500 }
    );
  }
}
