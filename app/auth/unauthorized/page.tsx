import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/Card";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-2xl font-bold">Access not allowed</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your login is valid, but your assigned role is not allowed to open this page.
        </p>
        <div className="mt-5 grid gap-2">
          <Link href="/dashboard" className="rounded-2xl bg-safety-green px-4 py-3 text-center text-sm font-semibold text-white">Go to dashboard</Link>
          <Link href="/auth/logout" className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Sign out</Link>
        </div>
      </Card>
    </main>
  );
}
