import Link from "next/link";
import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/Card";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-safety-green">
          <LockKeyhole size={28} />
        </div>
        <h1 className="text-2xl font-bold">EHS Console Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with Supabase email and password. Access is controlled by the role stored in the internal users table.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-600">Loading login form...</p>}>
          <LoginForm />
        </Suspense>
        <Link href="/track" className="mt-4 block text-center text-sm font-semibold text-safety-green">
          Reporter progress tracking
        </Link>
      </Card>
    </main>
  );
}
