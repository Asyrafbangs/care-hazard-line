import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleEnum = z.enum(["admin", "ehs", "action_owner", "hod", "viewer"]);

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: roleEnum,
  password: z.string().min(8)
});

const updateSchema = z.object({
  id: z.string().uuid(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional()
});

async function requireAdmin() {
  const profile = await getCurrentAppUser();
  if (!profile || profile.appUser.role !== "admin") return null;
  return profile;
}

// List all internal users.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, auth_user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, users: data ?? [] });
}

// Register a new internal user: create the auth account and the app-user row.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

  try {
    const input = createSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const supabase = createSupabaseAdmin();

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true
    });

    if (createError || !created?.user) {
      return NextResponse.json(
        { ok: false, error: createError?.message ?? "Could not create the login account." },
        { status: 400 }
      );
    }

    const { error: rowError } = await supabase.from("users").insert({
      auth_user_id: created.user.id,
      name: input.name,
      email,
      role: input.role,
      is_active: true
    });

    if (rowError) {
      // Avoid an orphan auth account if the profile row could not be created.
      await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
      return NextResponse.json({ ok: false, error: rowError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, email, role: input.role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// Update a user's role and/or active status.
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

  try {
    const input = updateSchema.parse(await request.json());

    // Prevent an admin from demoting or deactivating their own account (lock-out guard).
    if (input.id === admin.appUser.id && (input.role && input.role !== "admin" || input.isActive === false)) {
      return NextResponse.json({ ok: false, error: "You cannot demote or deactivate your own admin account." }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (input.role) patch.role = input.role;
    if (typeof input.isActive === "boolean") patch.is_active = input.isActive;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("users").update(patch).eq("id", input.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid input", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
