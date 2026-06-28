import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Filter, LockKeyhole, UserCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { statusLabel } from "@/lib/status";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const dynamic = "force-dynamic";

type OwnerOption = {
  id: string;
  name: string;
  email: string | null;
  departmentName: string | null;
  ownerLevel: string;
};

type ActionItem = {
  id: string;
  report_no: string;
  original_description: string;
  location_area: string | null;
  location_name: string | null;
  location_text: string | null;
  ai_hazard_summary: string | null;
  ai_category_name: string | null;
  ai_urgency: UrgencyLevel | null;
  final_urgency: UrgencyLevel | null;
  status: ReportStatus;
  created_at: string;
  assignment_id: string;
  action_required: string;
  due_date: string;
  assignment_status: ReportStatus;
  action_owner_id: string;
};

async function getOwnerOptions() {
  const supabase = createSupabaseAdmin();

  const { data: ownerRows } = await supabase
    .from("action_owners")
    .select("id, user_id, owner_level")
    .order("created_at", { ascending: true });

  const userIds = (ownerRows ?? []).map((owner) => owner.user_id).filter(Boolean);
  const { data: userRows } = userIds.length > 0
    ? await supabase.from("users").select("id, name, email, department_id").in("id", userIds)
    : { data: [] };

  const departmentIds = (userRows ?? []).map((user) => user.department_id).filter(Boolean);
  const { data: departmentRows } = departmentIds.length > 0
    ? await supabase.from("departments").select("id, name").in("id", departmentIds)
    : { data: [] };

  const usersById = new Map((userRows ?? []).map((user) => [user.id, user]));
  const departmentsById = new Map((departmentRows ?? []).map((department) => [department.id, department]));

  return (ownerRows ?? []).map((owner): OwnerOption => {
    const user = usersById.get(owner.user_id);
    const department = user?.department_id ? departmentsById.get(user.department_id) : null;
    return {
      id: owner.id,
      name: user?.name ?? "Unnamed owner",
      email: user?.email ?? null,
      departmentName: department?.name ?? null,
      ownerLevel: owner.owner_level
    };
  });
}

async function getActions(ownerId?: string): Promise<{ actions: ActionItem[]; owners: OwnerOption[]; selectedOwnerId: string | null; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const owners = await getOwnerOptions();
    const selectedOwnerId = ownerId ?? owners[0]?.id ?? null;

    let query = supabase
      .from("action_owner_report_detail")
      .select("id, report_no, original_description, location_area, location_name, location_text, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, created_at, assignment_id, action_required, due_date, assignment_status, action_owner_id")
      .not("assignment_id", "is", null)
      .order("due_date", { ascending: true });

    if (selectedOwnerId) {
      query = query.eq("action_owner_id", selectedOwnerId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return { actions: [], owners, selectedOwnerId, error: error.message };
    }

    return { actions: (data ?? []) as ActionItem[], owners, selectedOwnerId };
  } catch (error) {
    return {
      actions: [],
      owners: [],
      selectedOwnerId: null,
      error: error instanceof Error ? error.message : "Unknown action owner dashboard error."
    };
  }
}

export default async function ActionOwnerDashboardPage({ searchParams }: { searchParams?: Promise<{ ownerId?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const { actions, owners, selectedOwnerId, error } = await getActions(params.ownerId);
  const overdue = actions.filter((action) => new Date(action.due_date) < new Date() && !["closed", "cancelled"].includes(action.assignment_status)).length;
  const pendingVerification = actions.filter((action) => action.assignment_status === "pending_verification").length;
  const inProgress = actions.filter((action) => action.assignment_status === "in_progress").length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">Action owner console</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My assigned safety actions</h1>
            <p className="mt-2 max-w-3xl text-sm text-green-50">Privacy-safe action dashboard. Reporter name, phone number, employee ID, and company name are not loaded on this screen.</p>
          </div>
          <Link href="/dashboard" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-safety-green">EHS Dashboard</Link>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
          Action dashboard warning: {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Assigned" value={actions.length} note="Visible for selected owner" />
        <MetricCard label="In progress" value={inProgress} note="Owner has started action" />
        <MetricCard label="Pending verification" value={pendingVerification} note="Waiting for EHS review" />
        <MetricCard label="Overdue" value={overdue} note="Due date passed" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Filter size={18} /> Select action owner</h2>
            <p className="mt-2 text-sm text-slate-600">Temporary Phase 3B selector. Later this will be controlled by Supabase Auth login.</p>
            <div className="mt-4 space-y-2">
              {owners.length > 0 ? owners.map((owner) => (
                <Link
                  key={owner.id}
                  href={`/actions?ownerId=${owner.id}`}
                  className={`block rounded-2xl border p-3 text-sm transition ${selectedOwnerId === owner.id ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700 hover:border-safety-green/40"}`}
                >
                  <span className="font-bold">{owner.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{owner.departmentName ?? owner.ownerLevel} · {owner.email ?? "No email"}</span>
                </Link>
              )) : <p className="text-sm text-slate-600">No action owners found.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><LockKeyhole size={18} /> Privacy check</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="rounded-2xl bg-green-50 p-3 text-green-800"><CheckCircle2 className="mr-2 inline" size={16} /> Uses action-owner privacy view.</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-800"><AlertTriangle className="mr-2 inline" size={16} /> Reporter identity is not selected or displayed.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">Assigned action list</h2>
          {actions.length > 0 ? actions.map((action) => (
            <ActionCard key={action.assignment_id} action={action} />
          )) : (
            <Card>
              <h2 className="text-lg font-bold">No assigned actions</h2>
              <p className="mt-2 text-sm text-slate-600">Assign a report from the EHS report detail page to see it here.</p>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function ActionCard({ action }: { action: ActionItem }) {
  const urgency = action.final_urgency ?? action.ai_urgency ?? "medium";
  const location = action.location_name ? `${action.location_area ?? ""} - ${action.location_name}` : action.location_text ?? "Location not set";
  const isOverdue = new Date(action.due_date) < new Date() && !["closed", "cancelled"].includes(action.assignment_status);

  return (
    <Link href={`/actions/${action.assignment_id}`}>
      <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{action.report_no}</span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold capitalize text-safety-green">{urgency}</span>
              {isOverdue ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Overdue</span> : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-safety-ink">{action.ai_hazard_summary ?? action.original_description}</h3>
            <p className="mt-2 text-sm text-slate-600">{location}</p>
            <p className="mt-2 text-sm text-slate-700"><strong>Required action:</strong> {action.action_required}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 md:min-w-44">
            <p className="flex items-center gap-2"><Clock3 size={15} /> Due {action.due_date}</p>
            <p className="mt-2 font-bold capitalize">{statusLabel(action.assignment_status)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-safety-green">Open action <ArrowRight size={14} /></p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
