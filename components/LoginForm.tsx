"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase-client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/login", [searchParams]);
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
      // Full-page navigation (not client-side) so the auth cookies are fully
      // committed and the server establishes the session in a single clean
      // request. Avoids the client-nav session race that could log users out.
      window.location.assign(nextPath.startsWith("/") ? nextPath : "/login");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Login failed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendReset() {
    setMessage(null);

    if (!email.trim()) {
      setMessage({ type: "error", text: "Enter your email above first, then tap Forgot password." });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        // Use the current origin so the email link returns to this site (not localhost).
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage({
        type: "success",
        text: `Password reset link sent to ${email.trim()}. Check your email and open the link to set a new password.`
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not send reset link." });
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

      <button
        type="button"
        onClick={sendReset}
        disabled={isSubmitting}
        className="w-full text-center text-sm font-semibold text-safety-green underline disabled:opacity-50"
      >
        Forgot password?
      </button>
    </div>
  );
}
