import { NextResponse } from "next/server";
import { getActionOwnerIdForUser, getCurrentAppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentAppUser();
    if (!profile || !["admin", "ehs", "action_owner"].includes(profile.appUser.role)) {
      return NextResponse.json({ ok: false, error: "Internal login is required to view actions." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedOwnerId = searchParams.get("ownerId");
    const ownerId = profile.appUser.role === "action_owner" ? await getActionOwnerIdForUser(profile.appUser.id) : requestedOwnerId;
    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("action_owner_report_detail")
      .select("id, report_no, original_description, location_area, location_name, location_text, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, created_at, assignment_id, action_required, due_date, assignment_status, action_owner_id")
      .not("assignment_id", "is", null)
      .order("due_date", { ascending: true });

    if (ownerId) {
      query = query.eq("action_owner_id", ownerId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, actions: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown action list error." },
      { status: 500 }
    );
  }
}
