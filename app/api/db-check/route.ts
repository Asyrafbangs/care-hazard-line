import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { count, error } = await supabase
      .from("locations")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      database: "connected",
      locationsCount: count ?? 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown database check error" },
      { status: 500 }
    );
  }
}
