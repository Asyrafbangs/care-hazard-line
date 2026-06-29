import { NextResponse } from "next/server";
import { getCurrentAppUser, isEhsRole } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const profile = await getCurrentAppUser();
    if (!profile || !isEhsRole(profile.appUser.role)) {
      return NextResponse.json({ ok: false, error: "EHS role is required to list reports." }, { status: 403 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("ehs_report_detail")
      .select("report_no, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, location_name, location_text, created_at, reporter_name, reporter_phone_number")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reports: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown report list error" },
      { status: 500 }
    );
  }
}
