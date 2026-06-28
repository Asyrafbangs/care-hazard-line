import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-safety-green">
          <LockKeyhole size={28} />
        </div>
        <h1 className="text-2xl font-bold">EHS Console Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Phase 1 provides the Supabase Auth structure. Connect your Supabase project and enable email/password login before production testing.
        </p>
        <form className="mt-6 space-y-3">
          <label className="block text-sm font-semibold">
            Email
            <input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" type="email" placeholder="ehs.admin@example.com" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="••••••••" />
          </label>
          <Button type="button" className="w-full">Sign in</Button>
        </form>
        <Link href="/dashboard" className="mt-4 block text-center text-sm font-semibold text-safety-green">
          View demo dashboard without login
        </Link>
      </Card>
    </main>
  );
}
