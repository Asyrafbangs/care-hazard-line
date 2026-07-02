"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const router = useRouter();
  // Creating the client processes the recovery token in the URL (detectSessionInUrl).
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword() {
    setMessage(null);
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setMessage({ type: "success", text: "Password updated. Taking you to login..." });
      setTimeout(() => router.replace("/login"), 1500);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not update password." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
          <LockKeyhole size={28} />
        </div>
        <h1 className="text-2xl font-bold">Set a new password</h1>

        {checking ? (
          <p className="mt-4 text-sm text-slate-600">Checking your reset link...</p>
        ) : !ready ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              This reset link is invalid or has expired. Go back to login and tap &ldquo;Forgot password?&rdquo; to get a
              fresh link.
            </p>
            <Link href="/login" className="block text-center text-sm font-semibold text-blue-800 underline">
              Back to login
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                placeholder="min 8 characters"
              />
            </label>
            <label className="block text-sm font-semibold">
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                placeholder="re-enter password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") void updatePassword();
                }}
              />
            </label>

            {message ? (
              <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
                <div className="flex items-center gap-2">
                  {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  {message.text}
                </div>
              </div>
            ) : null}

            <Button type="button" onClick={updatePassword} disabled={isSubmitting} className="w-full justify-center gap-2">
              <LockKeyhole size={18} /> {isSubmitting ? "Saving..." : "Update password"}
            </Button>
          </div>
        )}

        {message && !ready ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-100">{message.text}</div>
        ) : null}
      </Card>
    </main>
  );
}
