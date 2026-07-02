import Link from "next/link";
import { Activity, ArrowRight, Database, Settings, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/Card";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { ReportCard } from "@/components/ReportCard";
import { StatusBadge } from "@/components/StatusBadge";
import { sampleReports } from "@/lib/dummy-data";
import { requireAppRole } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const dynamic = "force-dynamic";

type DashboardReport = {
  reportNo: string;
  location: string;
  summary: string;
  category: string;
  urgency: UrgencyLevel;
  status: ReportStatus;
  createdAt: string;
};

type QueueData = {
  reports: DashboardReport[];
  overdueReportNos: Set<string>;
  error?: string;
};

async function getQueue(): Promise<QueueData> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("ehs_report_detail")
      .select("id, report_no, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, location_name, location_text, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { reports: sampleReports, overdueReportNos: new Set(), error: error.message };
    }

    const reports = (data ?? []).map((item) => ({
      reportNo: item.report_no,
      location: item.location_name ?? item.location_text ?? "Location not set",
      summary: item.ai_hazard_summary ?? "Hazard report pending EHS review",
      category: item.ai_category_name ?? "Pending category",
      urgency: (item.final_urgency ?? item.ai_urgency ?? "medium") as UrgencyLevel,
      status: item.status as ReportStatus,
      createdAt: item.created_at
    }));

    // Overdue = open assignment past its due date.
    const idByNo = new Map((data ?? []).map((item) => [item.id as string, item.report_no as string]));
    const { data: assignments } = await supabase
      .from("report_assignments")
      .select("report_id, due_date, status")
      .not("status", "in", "(closed,cancelled)");

    const today = new Date();
    const overdueReportNos = new Set<string>();
    (assignments ?? []).forEach((assignment) => {
      if (assignment.due_date && new Date(assignment.due_date) < today) {
        const reportNo = idByNo.get(assignment.report_id);
        if (reportNo) overdueReportNos.add(reportNo);
      }
    });

    return { reports, overdueReportNos };
  } catch (error) {
    return {
      reports: sampleReports,
      overdueReportNos: new Set(),
      error: error instanceof Error ? error.message : "Report queue could not be loaded."
    };
  }
}

const TABS = [
  { key: "new", label: "New" },
  { key: "urgent", label: "Urgent" },
  { key: "overdue", label: "Overdue" },
  { key: "verify", label: "Verify" },
  { key: "all", label: "All" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const profile = await requireAppRole(["admin", "ehs", "hod"], "/ehs/dashboard");
  const params = searchParams ? await searchParams : {};
  const tab: TabKey = (TABS.some((item) => item.key === params.tab) ? params.tab : "new") as TabKey;
  const { reports, overdueReportNos, error } = await getQueue();

  const isOpen = (report: DashboardReport) => !["closed", "cancelled"].includes(report.status);
  const newReports = reports.filter((report) => ["submitted", "ehs_review"].includes(report.status));
  const urgentReports = reports.filter((report) => ["urgent", "high"].includes(report.urgency) && isOpen(report));
  const overdueReports = reports.filter((report) => overdueReportNos.has(report.reportNo) && isOpen(report));
  const verifyReports = reports.filter((report) => report.status === "pending_verification");

  const filtered: Record<TabKey, DashboardReport[]> = {
    new: newReports,
    urgent: urgentReports,
    overdue: overdueReports,
    verify: verifyReports,
    all: reports
  };
  const queue = filtered[tab];

  const attentionList = [...verifyReports, ...overdueReports, ...urgentReports]
    .filter((report, index, list) => list.findIndex((item) => item.reportNo === report.reportNo) === index)
    .slice(0, 5);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="space-y-4">
        <ConsoleHeader
          eyebrow="EHS Console"
          title="EHS Triage Inbox"
          description={`Signed in as ${profile.appUser.name}. What needs an EHS decision now?`}
          actions={
            <>
              <Link className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600" href="/ehs/verification"><ShieldCheck className="mr-1 inline" size={15} />Verification</Link>
              {profile.appUser.role === "admin" ? (
                <Link className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600" href="/admin/users"><Users className="mr-1 inline" size={15} />Users</Link>
              ) : null}
              <Link className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600" href="/admin/settings"><Settings className="mr-1 inline" size={15} />Settings</Link>
              <Link className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600" href="/admin/system-health"><Database className="mr-1 inline" size={15} />System</Link>
              <Link className="rounded-2xl bg-blue-800 px-3 py-2 text-sm font-semibold text-white" href="/auth/logout">Sign out</Link>
            </>
          }
        />

        {error ? (
          <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
            Some data could not be loaded just now. Showing what is available. ({error})
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="New reports" value={newReports.length} note="Waiting for EHS review" />
          <MetricCard label="Urgent / High" value={urgentReports.length} note="Open high-risk reports" />
          <MetricCard label="Overdue actions" value={overdueReports.length} note="Past the due date" />
          <MetricCard label="Pending verification" value={verifyReports.length} note="Closure to verify" />
        </section>

        <nav className="flex flex-wrap gap-2" aria-label="Report queue filter">
          {TABS.map((item) => {
            const count = filtered[item.key].length;
            const active = item.key === tab;
            return (
              <Link
                key={item.key}
                href={`/ehs/dashboard?tab=${item.key}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                  active ? "bg-blue-800 text-white ring-blue-800" : "bg-white text-slate-600 ring-slate-200 hover:ring-blue-300"
                }`}
              >
                {item.label} <span className={active ? "text-blue-100" : "text-slate-400"}>{count}</span>
              </Link>
            );
          })}
        </nav>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-3">
            {queue.length > 0 ? (
              queue.map((report) => <ReportCard key={report.reportNo} {...report} />)
            ) : (
              <EmptyState
                icon={<ShieldCheck size={20} />}
                title={tab === "new" ? "No new reports" : "Nothing here right now"}
                description={tab === "new" ? "New hazard reports will appear here for triage." : "Reports matching this filter will appear here."}
              />
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <h2 className="flex items-center gap-2 text-base font-bold"><Activity size={17} /> Needs attention now</h2>
              <div className="mt-3 space-y-2">
                {attentionList.length > 0 ? (
                  attentionList.map((report) => (
                    <Link
                      key={report.reportNo}
                      href={`/ehs/reports/${encodeURIComponent(report.reportNo)}`}
                      className="block rounded-2xl border border-slate-100 p-3 transition hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-500">{report.reportNo}</p>
                        <StatusBadge value={overdueReportNos.has(report.reportNo) ? "overdue" : report.status === "pending_verification" ? report.status : report.urgency} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-safety-ink">{report.summary}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-800">Open Report <ArrowRight size={13} /></p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-2xl bg-green-50 p-3 text-sm text-green-800">All clear — nothing urgent, overdue, or pending verification.</p>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-base font-bold">Quick links</h2>
              <div className="mt-3 grid gap-2 text-sm font-semibold">
                <Link href="/ehs/verification" className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 hover:bg-slate-100">EHS verification queue</Link>
                <Link href="/owner/actions" className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 hover:bg-slate-100">Action owner queues</Link>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
