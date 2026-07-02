import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const statusSchema = z.object({
  phoneNumber: z.string().trim().min(6),
  reportNo: z.string().trim().optional().nullable()
});

// Reporters from WhatsApp are stored in full international digits (e.g. a
// Malaysian number as 60XXXXXXXXX). Reporters often type the local 0-prefixed
// form. Build the set of equivalent formats so either one matches.
function phoneCandidates(phoneNumber: string): string[] {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits) return [];

  const set = new Set<string>([digits]);
  if (digits.startsWith("0")) {
    set.add(`60${digits.slice(1)}`); // 0xxxx -> 60xxxx
    set.add(digits.slice(1)); // bare national number
  } else if (digits.startsWith("60")) {
    set.add(`0${digits.slice(2)}`); // 60xxxx -> 0xxxx
    set.add(digits.slice(2)); // bare national number
  } else {
    set.add(`60${digits}`); // bare -> international
    set.add(`0${digits}`); // bare -> local
  }
  return [...set];
}

type ReportRow = {
  id: string;
  report_no: string;
  original_description: string;
  ai_hazard_summary: string | null;
  location_text: string | null;
  status: string;
  final_urgency: string | null;
  ai_urgency: string | null;
  submitted_at: string | null;
  closed_at: string | null;
  updated_at: string;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const payload = statusSchema.parse(await request.json());
    const supabase = createSupabaseAdmin();
    const candidates = phoneCandidates(payload.phoneNumber);

    // The same person may have more than one reporter row (e.g. created once via
    // WhatsApp and once via the web form with a different phone format). Match
    // every reporter row for the candidate numbers so all their reports show.
    const { data: reporters, error: reporterError } = await supabase
      .from("reporters")
      .select("id, name, preferred_language")
      .in("phone_number", candidates);

    if (reporterError) {
      return NextResponse.json({ ok: false, error: reporterError.message }, { status: 500 });
    }

    const reporter = reporters?.[0];
    const reporterIds = (reporters ?? []).map((row) => row.id);

    if (!reporter || reporterIds.length === 0) {
      return NextResponse.json({ ok: true, reporterFound: false, reports: [] });
    }

    let reportQuery = supabase
      .from("hazard_reports")
      .select("id, report_no, original_description, ai_hazard_summary, location_text, status, final_urgency, ai_urgency, submitted_at, closed_at, updated_at, created_at")
      .in("reporter_id", reporterIds)
      .order("created_at", { ascending: false })
      .limit(25);

    if (payload.reportNo) {
      reportQuery = reportQuery.eq("report_no", payload.reportNo.trim().toUpperCase());
    }

    const { data: reports, error: reportError } = await reportQuery;

    if (reportError) {
      return NextResponse.json({ ok: false, error: reportError.message }, { status: 500 });
    }

    const reportRows = (reports ?? []) as ReportRow[];
    const reportIds = reportRows.map((report) => report.id);

    const { data: assignments } = reportIds.length > 0
      ? await supabase
          .from("report_assignments")
          .select("id, report_id, action_required, due_date, status, updated_at")
          .in("report_id", reportIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const { data: history } = reportIds.length > 0
      ? await supabase
          .from("status_history")
          .select("id, report_id, old_status, new_status, comment, created_at")
          .in("report_id", reportIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const { data: notifications } = reportIds.length > 0
      ? await supabase
          .from("notifications")
          .select("id, report_id, channel, template_key, message_preview, status, created_at")
          .eq("recipient_type", "reporter")
          .in("recipient_reporter_id", reporterIds)
          .in("report_id", reportIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const assignmentsByReport = new Map<string, unknown[]>();
    (assignments ?? []).forEach((assignment) => {
      const list = assignmentsByReport.get(assignment.report_id) ?? [];
      list.push(assignment);
      assignmentsByReport.set(assignment.report_id, list);
    });

    const historyByReport = new Map<string, unknown[]>();
    (history ?? []).forEach((item) => {
      const list = historyByReport.get(item.report_id) ?? [];
      list.push(item);
      historyByReport.set(item.report_id, list);
    });

    const notificationsByReport = new Map<string, unknown[]>();
    (notifications ?? []).forEach((item) => {
      const list = notificationsByReport.get(item.report_id) ?? [];
      list.push(item);
      notificationsByReport.set(item.report_id, list);
    });

    return NextResponse.json({
      ok: true,
      reporterFound: true,
      reporter: {
        name: reporter.name,
        preferredLanguage: reporter.preferred_language
      },
      reports: reportRows.map((report) => ({
        reportNo: report.report_no,
        summary: report.ai_hazard_summary ?? report.original_description,
        location: report.location_text,
        status: report.status,
        urgency: report.final_urgency ?? report.ai_urgency ?? "medium",
        submittedAt: report.submitted_at ?? report.created_at,
        closedAt: report.closed_at,
        updatedAt: report.updated_at,
        assignments: assignmentsByReport.get(report.id) ?? [],
        history: historyByReport.get(report.id) ?? [],
        notifications: notificationsByReport.get(report.id) ?? []
      }))
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid tracking request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown status tracking error." },
      { status: 500 }
    );
  }
}
