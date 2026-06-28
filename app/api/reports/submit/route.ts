import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { generateReportNo } from "@/lib/report-number";

const submitSchema = z.object({
  reporter: z.object({
    name: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(6),
    category: z.enum(["employee", "visitor"]),
    employeeId: z.string().trim().optional().nullable(),
    companyName: z.string().trim().optional().nullable(),
    preferredLanguage: z.enum(["en", "ms", "ne", "my", "bn"]).default("en"),
    identityVisibility: z.enum(["ehs_only", "show_to_owner"]).default("ehs_only")
  }),
  report: z.object({
    description: z.string().trim().min(4),
    locationName: z.string().trim().min(1),
    locationText: z.string().trim().optional().nullable(),
    photoName: z.string().trim().min(1),
    aiSummary: z.object({
      hazardSummary: z.string().trim().min(1),
      suggestedCategory: z.string().trim().min(1),
      urgencyLevel: z.enum(["low", "medium", "high", "urgent"]),
      recommendedImmediateAction: z.string().trim().min(1),
      suggestedOwnerDepartment: z.string().trim().min(1),
      aiStatus: z.enum(["completed", "fallback", "failed"])
    }),
    reporterConfirmedAiSummary: z.boolean().default(true),
    reporterCorrection: z.string().trim().optional().nullable()
  })
});

export async function POST(request: Request) {
  try {
    const payload = submitSchema.parse(await request.json());
    const supabase = createSupabaseAdmin();

    const phoneNumber = payload.reporter.phoneNumber.replace(/[\s+()-]/g, "");

    const { data: reporter, error: reporterError } = await supabase
      .from("reporters")
      .upsert(
        {
          whatsapp_id: `wa_${phoneNumber}`,
          phone_number: phoneNumber,
          name: payload.reporter.name,
          category: payload.reporter.category,
          employee_id: payload.reporter.employeeId || null,
          company_name: payload.reporter.companyName || null,
          preferred_language: payload.reporter.preferredLanguage,
          identity_visibility: payload.reporter.identityVisibility,
          consent_accepted: true,
          consent_accepted_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        },
        { onConflict: "phone_number" }
      )
      .select("id, preferred_language")
      .single();

    if (reporterError || !reporter) {
      throw new Error(reporterError?.message ?? "Reporter could not be created or updated.");
    }

    await supabase.from("language_preferences").insert({
      reporter_id: reporter.id,
      language_code: payload.reporter.preferredLanguage,
      source: "web_reporting_flow"
    });

    const { data: selectedLocation } = await supabase
      .from("locations")
      .select("id, area, name")
      .eq("name", payload.report.locationName)
      .maybeSingle();

    const reportNo = await generateReportNo(supabase);
    const submittedAt = new Date().toISOString();

    const { data: report, error: reportError } = await supabase
      .from("hazard_reports")
      .insert({
        report_no: reportNo,
        reporter_id: reporter.id,
        report_type: "hazard",
        original_description: payload.report.description,
        translated_description: null,
        selected_language: payload.reporter.preferredLanguage,
        location_id: selectedLocation?.id ?? null,
        location_text: selectedLocation ? `${selectedLocation.area} - ${selectedLocation.name}` : payload.report.locationText || payload.report.locationName,
        ai_hazard_summary: payload.report.aiSummary.hazardSummary,
        ai_category_name: payload.report.aiSummary.suggestedCategory,
        ai_urgency: payload.report.aiSummary.urgencyLevel,
        ai_recommended_immediate_action: payload.report.aiSummary.recommendedImmediateAction,
        ai_suggested_owner_department: payload.report.aiSummary.suggestedOwnerDepartment,
        ai_status: payload.report.aiSummary.aiStatus,
        reporter_confirmed_ai_summary: payload.report.reporterConfirmedAiSummary,
        reporter_correction: payload.report.reporterCorrection || null,
        final_urgency: payload.report.aiSummary.urgencyLevel,
        status: "submitted",
        is_urgent_alert_sent: ["high", "urgent"].includes(payload.report.aiSummary.urgencyLevel),
        submitted_at: submittedAt
      })
      .select("id, report_no, status")
      .single();

    if (reportError || !report) {
      throw new Error(reportError?.message ?? "Report could not be created.");
    }

    // Phase 2A stores a mandatory placeholder photo reference first.
    // Phase 2B will replace this with a real Cloudinary public ID and secure URL.
    const safePhotoName = payload.report.photoName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const { error: photoError } = await supabase.from("hazard_photos").insert({
      report_id: report.id,
      cloudinary_public_id: `phase-2a-pending/${report.report_no}/${safePhotoName}`,
      cloudinary_url: `pending-cloudinary://${report.report_no}/${safePhotoName}`,
      photo_type: "hazard",
      uploaded_by_reporter_id: reporter.id
    });

    if (photoError) {
      throw new Error(`Report created but photo record failed: ${photoError.message}`);
    }

    await supabase.from("status_history").insert({
      report_id: report.id,
      old_status: "draft",
      new_status: "submitted",
      changed_by_reporter_id: reporter.id,
      comment: "Reporter accepted AI summary and submitted through web reporting flow."
    });

    if (["high", "urgent"].includes(payload.report.aiSummary.urgencyLevel)) {
      const { data: ehsUsers } = await supabase.from("ehs_users").select("user_id");
      const notificationRows = (ehsUsers ?? []).map((user) => ({
        report_id: report.id,
        recipient_type: "ehs",
        recipient_user_id: user.user_id,
        channel: "in_app",
        template_key: "urgent_hazard_alert",
        message_preview: `Urgent/high hazard report ${report.report_no} requires EHS review.`,
        status: "pending"
      }));

      if (notificationRows.length > 0) {
        await supabase.from("notifications").insert(notificationRows);
      }
    }

    return NextResponse.json({
      ok: true,
      reportNo: report.report_no,
      status: report.status,
      reporterId: reporter.id,
      photoMode: "pending_cloudinary"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid report data", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown report submission error" },
      { status: 500 }
    );
  }
}
