"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function signIn() {
    setMessage(null);

    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Enter email and password." });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage({ type: "success", text: "Signed in. Opening your console..." });
      router.refresh();
      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Login failed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="block text-sm font-semibold">
        Email
        <input
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-safety-green"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ehs.admin@example.com"
        />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-safety-green"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          onKeyDown={(event) => {
            if (event.key === "Enter") void signIn();
          }}
        />
      </label>

      {message ? (
        <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
          <div className="flex items-center gap-2">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{message.text}</div>
        </div>
      ) : null}

      <Button type="button" onClick={signIn} disabled={isSubmitting} className="w-full justify-center gap-2">
        <LockKeyhole size={18} /> {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-100">
        Create Supabase Auth users first using the same emails in the public.users table. On first login, the app automatically links auth_user_id by email.
      </div>
    </div>
  );
}
