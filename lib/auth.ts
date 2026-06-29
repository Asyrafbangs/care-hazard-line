import { redirect } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type AppRole = "admin" | "ehs" | "action_owner" | "hod" | "viewer";

export type AppUserProfile = {
  authUserId: string;
  email: string;
  appUser: {
    id: string;
    auth_user_id: string | null;
    name: string;
    email: string;
    role: AppRole;
    department_id: string | null;
    phone_number: string | null;
    is_active: boolean;
  };
};

export async function getCurrentAppUser(): Promise<AppUserProfile | null> {
  const supabaseAuth = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabaseAuth.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const supabase = createSupabaseAdmin();

  let { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, auth_user_id, name, email, role, department_id, phone_number, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!appUser && !appUserError) {
    const result = await supabase
      .from("users")
      .select("id, auth_user_id, name, email, role, department_id, phone_number, is_active")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    appUser = result.data;
    appUserError = result.error;
  }

  if (appUserError || !appUser || !appUser.is_active) {
    return null;
  }

  if (!appUser.auth_user_id) {
    await supabase.from("users").update({ auth_user_id: user.id }).eq("id", appUser.id);
    appUser.auth_user_id = user.id;
  }

  return {
    authUserId: user.id,
    email: user.email,
    appUser: appUser as AppUserProfile["appUser"]
  };
}

export async function requireAppRole(allowedRoles: AppRole[], nextPath: string): Promise<AppUserProfile> {
  const profile = await getCurrentAppUser();

  if (!profile) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!allowedRoles.includes(profile.appUser.role)) {
    redirect("/auth/unauthorized");
  }

  return profile;
}

export async function getActionOwnerIdForUser(appUserId: string): Promise<string | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("action_owners")
    .select("id")
    .eq("user_id", appUserId)
    .maybeSingle();

  return data?.id ?? null;
}

export function isEhsRole(role: AppRole) {
  return role === "admin" || role === "ehs" || role === "hod";
}
