import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/Card";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentAppUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Where each role lands after signing in.
function landingPathForRole(role: string) {
  if (role === "action_owner") return "/owner/actions";
  // admin, ehs, hod and any other internal role start at the EHS console.
  return "/ehs/dashboard";
}

export default async function InternalLoginPage() {
  const profile = await getCurrentAppUser();
  if (profile) {
    redirect(landingPathForRole(profile.appUser.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-safety-green">
          <LockKeyhole size={28} />
        </div>
        <h1 className="text-2xl font-bold">Internal Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          For EHS, Action Owners, Managers, and Admin only. Sign in with your Supabase email and password.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-600">Loading login form...</p>}>
          <LoginForm />
        </Suspense>
        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-safety-green">
          Back to CARE Hazard Line
        </Link>
      </Card>
    </main>
  );
}
