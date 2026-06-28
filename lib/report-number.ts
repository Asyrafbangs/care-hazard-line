import type { SupabaseClient } from "@supabase/supabase-js";

function nextSequenceFromReportNo(reportNo: string | null | undefined): number {
  if (!reportNo) return 1;
  const lastPart = reportNo.split("-").pop();
  const parsed = Number.parseInt(lastPart ?? "0", 10);
  return Number.isFinite(parsed) ? parsed + 1 : 1;
}

export async function generateReportNo(supabase: SupabaseClient, now = new Date()): Promise<string> {
  const year = now.getFullYear();
  const prefix = `HZ-${year}-`;

  const { data, error } = await supabase
    .from("hazard_reports")
    .select("report_no")
    .like("report_no", `${prefix}%`)
    .order("report_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to generate report number: ${error.message}`);
  }

  const nextSequence = nextSequenceFromReportNo(data?.report_no);
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
