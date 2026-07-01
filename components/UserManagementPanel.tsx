"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export type AppUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  auth_user_id: string | null;
  created_at: string;
};

const ROLES = ["admin", "ehs", "action_owner", "hod", "viewer"] as const;
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  ehs: "EHS",
  action_owner: "Action owner",
  hod: "Manager / HOD",
  viewer: "Viewer"
};

type Message = { type: "success" | "error"; text: string };

export function UserManagementPanel({
  initialUsers,
  currentUserId
}: {
  initialUsers: AppUserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<AppUserRow[]>(initialUsers);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  // New-user form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("ehs");
  const [password, setPassword] = useState("");

  // Password reset
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setUsers(data.users as AppUserRow[]);
  }

  async function createUser() {
    setMessage(null);
    if (name.trim().length < 2 || !email.trim() || password.length < 8) {
      setMessage({ type: "error", text: "Enter a name, a valid email, and a password of at least 8 characters." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, password })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not create user.");
      setMessage({ type: "success", text: `Created ${data.email} as ${ROLE_LABELS[data.role] ?? data.role}. Share the temporary password with them.` });
      setName("");
      setEmail("");
      setPassword("");
      setRole("ehs");
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not create user." });
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(id: string, patch: { role?: string; isActive?: boolean }) {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not update user.");
      setMessage({ type: "success", text: "User updated." });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not update user." });
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(id: string) {
    setMessage(null);
    if (resetPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: resetPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not reset password.");
      setMessage({ type: "success", text: `Password reset for ${data.email}. Share the new temporary password with them.` });
      setResetFor(null);
      setResetPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not reset password." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        </div>
      ) : null}

      {/* Register new user */}
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus size={18} /> Register new user</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="Jane Tan" />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="jane.tan@company.com" />
          </label>
          <label className="block text-sm font-semibold">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Temporary password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="text" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="min 8 characters" />
          </label>
        </div>
        <Button onClick={createUser} disabled={busy} className="mt-4 justify-center gap-2"><UserPlus size={18} /> {busy ? "Working..." : "Create user"}</Button>
        <p className="mt-2 text-xs text-slate-500">The user signs in with this temporary password. Ask them to change it, or reset it here anytime.</p>
      </Card>

      {/* Existing users */}
      <Card>
        <h2 className="text-lg font-bold">Internal users ({users.length})</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-safety-ink">
                    {user.name}
                    {user.id === currentUserId ? <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-safety-green">You</span> : null}
                    {!user.is_active ? <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Inactive</span> : null}
                    {!user.auth_user_id ? <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">No login</span> : null}
                  </p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    disabled={busy || user.id === currentUserId}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-safety-green disabled:opacity-50"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <button
                    onClick={() => updateUser(user.id, { isActive: !user.is_active })}
                    disabled={busy || user.id === currentUserId}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { setResetFor(resetFor === user.id ? null : user.id); setResetPassword(""); setMessage(null); }}
                    disabled={busy || !user.auth_user_id}
                    className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <KeyRound size={15} /> Reset password
                  </button>
                </div>
              </div>

              {resetFor === user.id ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3">
                  <input
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    type="text"
                    placeholder="New temporary password (min 8)"
                    className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-safety-green"
                  />
                  <Button onClick={() => submitReset(user.id)} disabled={busy} className="justify-center gap-1 px-4 py-2 text-sm"><KeyRound size={15} /> Set password</Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
