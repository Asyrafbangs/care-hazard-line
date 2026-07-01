import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAppRole } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { UserManagementPanel, type AppUserRow } from "@/components/UserManagementPanel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await requireAppRole(["admin"], "/admin/users");
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, auth_user_id, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <Link href="/ehs/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <header className="mb-6 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-safety-green">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">User management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register internal users, set their roles, activate/deactivate access, and reset passwords for EHS, action
          owners, managers, and admins.
        </p>
      </header>

      <UserManagementPanel initialUsers={(data ?? []) as AppUserRow[]} currentUserId={profile.appUser.id} />
    </main>
  );
}
