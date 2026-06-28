import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ImageIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { statusLabel } from "@/lib/status";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const dynamic = "force-dynamic";

type VerificationItem = {
  id: string;
  report_no: string;
  original_description: string;
  ai_hazard_summary: string | null;
  location_area: string | null;
  location_name: string | null;
  location_text: string | null;
  final_urgency: UrgencyLevel | null;
  ai_urgency: UrgencyLevel | null;
  status: ReportStatus;
  assignment_id: string;
  action_required: string;
  due_date: string;
  assignment_status: ReportStatus;
  action_owner_id: string;
};

async function getPendingVerification(): Promise<{ items: VerificationItem[]; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("action_owner_report_detail")
      .select("id, report_no, original_description, ai_hazard_summary, location_area, location_name, location_text, final_urgency, ai_urgency, status, assignment_id, action_required, due_date, assignment_status, action_owner_id")
      .eq("assignment_status", "pending_verification")
      .order("due_date", { ascending: true });

    if (error) {
      return { items: [], error: error.message };
    }

    return { items: (data ?? []) as VerificationItem[] };
  } catch (error) {
    return { items: [], error: error instanceof Error ? error.message : "Unknown verification list error." };
  }
}

export default async function EhsVerificationQueuePage() {
  const { items, error } = await getPendingVerification();
  const highOrUrgent = items.filter((item) => ["high", "urgent"].includes(item.final_urgency ?? item.ai_urgency ?? "medium")).length;
  const overdue = items.filter((item) => new Date(item.due_date) < new Date()).length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">EHS verification queue</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pending verification</h1>
            <p className="mt-2 max-w-3xl text-sm text-green-50">Review action owner closure evidence. Close only when the corrective action is effective.</p>
          </div>
          <Link href="/dashboard" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-safety-green">Back to dashboard</Link>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">Verification queue warning: {error}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pending verification" value={items.length} note="Action owner submitted closure" />
        <MetricCard label="High / urgent" value={highOrUrgent} note="Prioritize EHS review" />
        <MetricCard label="Past due date" value={overdue} note="Due date has passed" />
      </section>

      <section className="mt-6 space-y-3">
        {items.length > 0 ? items.map((item) => <VerificationCard key={item.assignment_id} item={item} />) : (
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={20} />No pending verification</h2>
            <p className="mt-2 text-sm text-slate-600">Action owner submissions will appear here after they upload closure evidence.</p>
          </Card>
        )}
      </section>
    </main>
  );
}

function VerificationCard({ item }: { item: VerificationItem }) {
  const urgency = item.final_urgency ?? item.ai_urgency ?? "medium";
  const location = item.location_name ? `${item.location_area ?? ""} - ${item.location_name}` : item.location_text ?? "Location not set";

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusLabel(item.assignment_status)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{urgency}</span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-safety-ink">{item.report_no}</h2>
          <p className="mt-2 text-sm text-slate-600">{item.ai_hazard_summary ?? item.original_description}</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            <p><Clock3 className="mr-1 inline" size={15} /> Due: {item.due_date}</p>
            <p><ImageIcon className="mr-1 inline" size={15} /> Closure evidence ready for review</p>
            <p className="md:col-span-2"><ShieldCheck className="mr-1 inline" size={15} /> Location: {location}</p>
          </div>
          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700"><strong>Required action:</strong> {item.action_required}</p>
        </div>
        <Link href={`/dashboard/reports/${encodeURIComponent(item.report_no)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-safety-green px-4 py-3 text-sm font-semibold text-white">
          Verify action <ArrowRight size={16} />
        </Link>
      </div>
    </Card>
  );
}
