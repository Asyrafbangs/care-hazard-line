import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ImageIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAppRole } from "@/lib/auth";
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
  await requireAppRole(["admin", "ehs", "hod"], "/ehs/verification");
  const { items, error } = await getPendingVerification();
  const highOrUrgent = items.filter((item) => ["high", "urgent"].includes(item.final_urgency ?? item.ai_urgency ?? "medium")).length;
  const overdue = items.filter((item) => new Date(item.due_date) < new Date()).length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-4">
        <ConsoleHeader
          eyebrow="EHS Console"
          title="Verification queue"
          description="Review closure evidence. Accept only when the corrective action is effective."
          actions={<Link href="/ehs/dashboard" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Back to dashboard</Link>}
        />
      </div>

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
          <EmptyState
            icon={<CheckCircle2 size={20} />}
            title="No pending verification"
            description="Action owner submissions will appear here after they upload closure evidence."
          />
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
            <StatusBadge value={item.assignment_status} />
            <StatusBadge value={urgency} />
            {new Date(item.due_date) < new Date() ? <StatusBadge value="overdue" /> : null}
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
        <Link href={`/ehs/reports/${encodeURIComponent(item.report_no)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-safety-green px-4 py-3 text-sm font-semibold text-white">
          View Evidence <ArrowRight size={16} />
        </Link>
      </div>
    </Card>
  );
}
