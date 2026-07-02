import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, MessageCircle, Sparkles, XCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { requireAppRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

function has(name: string) {
  return Boolean(process.env[name] && process.env[name]!.trim());
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 font-bold text-safety-green"><CheckCircle2 size={16} /> Configured</span>
      ) : (
        <span className="inline-flex items-center gap-1 font-bold text-red-600"><XCircle size={16} /> Missing</span>
      )}
    </div>
  );
}

export default async function SystemHealthPage() {
  await requireAppRole(["admin", "ehs"], "/admin/system-health");

  const supabase = [
    { label: "NEXT_PUBLIC_SUPABASE_URL", ok: has("NEXT_PUBLIC_SUPABASE_URL") },
    { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: has("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    { label: "SUPABASE_SERVICE_ROLE_KEY", ok: has("SUPABASE_SERVICE_ROLE_KEY") }
  ];
  const whatsapp = [
    { label: "WHATSAPP_VERIFY_TOKEN", ok: has("WHATSAPP_VERIFY_TOKEN") },
    { label: "WHATSAPP_ACCESS_TOKEN", ok: has("WHATSAPP_ACCESS_TOKEN") },
    { label: "WHATSAPP_PHONE_NUMBER_ID", ok: has("WHATSAPP_PHONE_NUMBER_ID") }
  ];
  const ai = [
    { label: "GEMINI_API_KEY", ok: has("GEMINI_API_KEY") },
    { label: "WHATSAPP_AI_MODE", ok: has("WHATSAPP_AI_MODE") }
  ];

  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "n/a";
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6">
      <Link href="/ehs/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <header className="mb-6 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-800">Admin · System</p>
        <h1 className="mt-2 text-3xl font-bold">System health</h1>
        <p className="mt-2 text-sm text-slate-600">
          Build, environment, and API status. Only configuration presence is shown — never the secret values.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={18} /> Build</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <StatusRow label={`Environment: ${env}`} ok={true} />
            <StatusRow label={`Commit: ${commit}`} ok={commit !== "local"} />
            <StatusRow label={`Branch: ${branch}`} ok={branch !== "n/a"} />
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle size={18} /> AI (Gemini)</h2>
          <div className="mt-4 grid gap-2">{ai.map((row) => <StatusRow key={row.label} {...row} />)}</div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><Database size={18} /> Supabase</h2>
          <div className="mt-4 grid gap-2">{supabase.map((row) => <StatusRow key={row.label} {...row} />)}</div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle size={18} /> WhatsApp</h2>
          <div className="mt-4 grid gap-2">{whatsapp.map((row) => <StatusRow key={row.label} {...row} />)}</div>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-lg font-bold">Live checks</h2>
        <p className="mt-2 text-sm text-slate-600">Open these endpoints for live diagnostics:</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <a href="/api/health" target="_blank" rel="noreferrer" className="rounded-2xl bg-blue-50 px-4 py-2 text-blue-800">/api/health</a>
          <a href="/api/whatsapp/production-check" target="_blank" rel="noreferrer" className="rounded-2xl bg-blue-50 px-4 py-2 text-blue-800">/api/whatsapp/production-check</a>
          <a href="/api/db-check" target="_blank" rel="noreferrer" className="rounded-2xl bg-blue-50 px-4 py-2 text-blue-800">/api/db-check</a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <Link href="/dev/whatsapp-simulator" className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-700">WhatsApp Simulator</Link>
          <Link href="/dev/whatsapp-setup" className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-700">WhatsApp Setup</Link>
        </div>
      </Card>
    </main>
  );
}
