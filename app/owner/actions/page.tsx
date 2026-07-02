import Link from "next/link";
import { ArrowRight, Clock3, Filter, UserCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getActionOwnerIdForUser, requireAppRole } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
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
      error: error instanceof Error ? error.message : "Actions could not be loaded."
    };
  }
}

const TABS = [
  { key: "open", label: "Open" },
  { key: "due-soon", label: "Due soon" },
  { key: "overdue", label: "Overdue" },
  { key: "verify", label: "Pending verification" },
  { key: "closed", label: "Closed" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function ActionOwnerDashboardPage({ searchParams }: { searchParams?: Promise<{ ownerId?: string; tab?: string }> }) {
  const profile = await requireAppRole(["admin", "ehs", "action_owner"], "/owner/actions");
  const params = searchParams ? await searchParams : {};
  const tab: TabKey = (TABS.some((item) => item.key === params.tab) ? params.tab : "open") as TabKey;
  const forcedOwnerId = profile.appUser.role === "action_owner" ? await getActionOwnerIdForUser(profile.appUser.id) : null;
  const canSelectOwner = profile.appUser.role !== "action_owner";
  const { actions, owners, selectedOwnerId, error } = await getActions(forcedOwnerId ?? params.ownerId);

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  const isClosed = (action: ActionItem) => ["closed", "cancelled"].includes(action.assignment_status);
  const isOverdue = (action: ActionItem) => new Date(action.due_date) < now && !isClosed(action);
  const filtered: Record<TabKey, ActionItem[]> = {
    open: actions.filter((action) => !isClosed(action)),
    "due-soon": actions.filter((action) => !isClosed(action) && new Date(action.due_date) >= now && new Date(action.due_date) <= soon),
    overdue: actions.filter(isOverdue),
    verify: actions.filter((action) => action.assignment_status === "pending_verification"),
    closed: actions.filter(isClosed)
  };
  const list = filtered[tab];

  const overdueCount = filtered.overdue.length;
  const pendingVerification = filtered.verify.length;
  const inProgress = actions.filter((action) => action.assignment_status === "in_progress").length;

  const ownerQuery = selectedOwnerId && canSelectOwner ? `&ownerId=${selectedOwnerId}` : "";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="space-y-4">
        <ConsoleHeader
          eyebrow="Action Owner"
          title="My Actions"
          description={`Signed in as ${profile.appUser.name}. Reporter hidden for privacy.`}
          actions={
            <>
              {profile.appUser.role === "action_owner" ? null : (
                <Link href="/ehs/dashboard" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">EHS Dashboard</Link>
              )}
              <Link href="/auth/logout" className="rounded-2xl bg-blue-800 px-3 py-2 text-sm font-semibold text-white">Sign out</Link>
            </>
          }
        />

        {error ? (
          <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">Some actions could not be loaded: {error}</div>
        ) : null}

        {profile.appUser.role === "action_owner" && !forcedOwnerId ? (
          <Card>
            <h2 className="text-lg font-bold">No action owner profile linked</h2>
            <p className="mt-2 text-sm text-slate-600">Your login works, but it is not linked as an action owner yet. Ask EHS or an admin to link your account.</p>
          </Card>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Open" value={filtered.open.length} note="Assigned to this queue" />
          <MetricCard label="In progress" value={inProgress} note="Work has started" />
          <MetricCard label="Pending verification" value={pendingVerification} note="Waiting for EHS" />
          <MetricCard label="Overdue" value={overdueCount} note="Past the due date" />
        </section>

        <nav className="flex flex-wrap gap-2" aria-label="Action filter">
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <Link
                key={item.key}
                href={`/owner/actions?tab=${item.key}${ownerQuery}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                  active ? "bg-blue-800 text-white ring-blue-800" : "bg-white text-slate-600 ring-slate-200 hover:ring-blue-300"
                }`}
              >
                {item.label} <span className={active ? "text-blue-100" : "text-slate-400"}>{filtered[item.key].length}</span>
              </Link>
            );
          })}
        </nav>

        <section className={`grid gap-4 ${canSelectOwner ? "lg:grid-cols-[0.8fr_1.6fr]" : ""}`}>
          {canSelectOwner ? (
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <Card>
                <h2 className="flex items-center gap-2 text-base font-bold"><Filter size={17} /> Action owner queues</h2>
                <p className="mt-2 text-sm text-slate-600">EHS/Admin can review each owner&rsquo;s queue. Owners only see their own.</p>
                <div className="mt-3 space-y-2">
                  {owners.length > 0 ? owners.map((owner) => (
                    <Link
                      key={owner.id}
                      href={`/owner/actions?tab=${tab}&ownerId=${owner.id}`}
                      className={`block rounded-2xl border p-3 text-sm transition ${selectedOwnerId === owner.id ? "border-blue-800 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}
                    >
                      <span className="font-bold">{owner.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{owner.departmentName ?? owner.ownerLevel}</span>
                    </Link>
                  )) : <p className="text-sm text-slate-600">No action owners found.</p>}
                </div>
              </Card>
            </div>
          ) : null}

          <div className="space-y-3">
            {list.length > 0 ? (
              list.map((action) => <ActionCard key={action.assignment_id} action={action} overdue={isOverdue(action)} />)
            ) : (
              <EmptyState
                icon={<UserCheck size={20} />}
                title="Nothing here"
                description="Actions matching this filter will appear here."
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionCard({ action, overdue }: { action: ActionItem; overdue: boolean }) {
  const urgency = action.final_urgency ?? action.ai_urgency ?? "medium";
  const location = action.location_name ? `${action.location_area ?? ""} - ${action.location_name}` : action.location_text ?? "Location not set";

  return (
    <Link href={`/owner/actions/${action.assignment_id}`}>
      <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{action.report_no}</span>
              <StatusBadge value={urgency} />
              {overdue ? <StatusBadge value="overdue" /> : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-safety-ink">{action.ai_hazard_summary ?? action.original_description}</h3>
            <p className="mt-2 text-sm text-slate-600">{location}</p>
            <p className="mt-2 text-sm text-slate-700"><strong>Required action:</strong> {action.action_required}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 md:min-w-44">
            <p className="flex items-center gap-2"><Clock3 size={15} /> Due {action.due_date}</p>
            <div className="mt-2"><StatusBadge value={action.assignment_status} /></div>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-800">Update Action <ArrowRight size={14} /></p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
