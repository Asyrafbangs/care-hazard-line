import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8)
});

// Admin-driven password reset: set a new temporary password for a user who
// forgot theirs. The admin shares it with the user, who can use it immediately.
export async function POST(request: Request) {
  const profile = await getCurrentAppUser();
  if (!profile || profile.appUser.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
  }

  try {
    const { id, password } = schema.parse(await request.json());
    const supabase = createSupabaseAdmin();

    const { data: row, error: rowError } = await supabase
      .from("users")
      .select("auth_user_id, email")
      .eq("id", id)
      .maybeSingle();

    if (rowError) return NextResponse.json({ ok: false, error: rowError.message }, { status: 500 });
    if (!row?.auth_user_id) {
      return NextResponse.json({ ok: false, error: "This user has no linked login account." }, { status: 400 });
    }

    const { error } = await supabase.auth.admin.updateUserById(row.auth_user_id, { password });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, email: row.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
