import Link from "next/link";
import { Bell, Database, Filter, Settings, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { ReportCard } from "@/components/ReportCard";
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

async function getReports(): Promise<{ reports: DashboardReport[]; source: "supabase" | "dummy"; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("ehs_report_detail")
      .select("report_no, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, location_name, location_text, created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return { reports: sampleReports, source: "dummy", error: error.message };
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

    return { reports, source: "supabase" };
  } catch (error) {
    return {
      reports: sampleReports,
      source: "dummy",
      error: error instanceof Error ? error.message : "Dashboard data fallback used."
    };
  }
}

export default async function DashboardPage() {
  const profile = await requireAppRole(["admin", "ehs", "hod"], "/ehs/dashboard");
  const { reports, source, error } = await getReports();
  const urgent = reports.filter((report) => report.urgency === "urgent" || report.urgency === "high").length;
  const newReports = reports.filter((report) => report.status === "submitted" || report.status === "ehs_review").length;
  const openReports = reports.filter((report) => !["closed", "cancelled"].includes(report.status)).length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-safety-green p-6 text-white shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">EHS Console</p>
          <h1 className="mt-2 text-3xl font-bold">CARE Hazard Dashboard</h1>
          <p className="mt-2 text-sm text-green-50">
            {source === "supabase" ? "Reading live reports from Supabase." : "Using dummy fallback data because Supabase data could not be loaded."}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="hidden rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold md:inline">{profile.appUser.name}</span>
          <Link className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold" href="/ehs/verification"><ShieldCheck className="mr-2 inline" size={16} />Verification</Link>
          <Link className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold" href="/admin/settings"><Settings className="mr-2 inline" size={16} />Settings</Link>
          <Link className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold" href="/admin/system-health"><Database className="mr-2 inline" size={16} />System</Link>
          <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-safety-green" href="/auth/logout">Sign out</Link>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
          <Database className="mr-2 inline" size={16} /> Dashboard fallback: {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="New reports" value={newReports} note="Submitted / EHS review" />
        <MetricCard label="Urgent / High" value={urgent} note="Immediate EHS alert" />
        <MetricCard label="Open reports" value={openReports} note="Not closed or cancelled" />
        <MetricCard label="Total loaded" value={reports.length} note={source === "supabase" ? "From Supabase" : "Dummy fallback"} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Priority queue</h2>
            <button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><Filter className="mr-2 inline" size={16} />Filter</button>
          </div>
          {reports.length > 0 ? reports.map((report) => (
            <ReportCard key={report.reportNo} {...report} />
          )) : (
            <Card>
              <h2 className="text-lg font-bold">No reports yet</h2>
              <p className="mt-2 text-sm text-slate-600">Submit a report from the mobile reporting flow to see it here.</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Bell size={18} /> Alerts</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="rounded-2xl bg-red-50 p-3 text-red-800">High-risk and urgent reports create pending EHS alert records.</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-800">Action owner visibility excludes reporter name and phone number.</p>
              <p className="rounded-2xl bg-green-50 p-3 text-green-800">Reporter progress tracking and closure update placeholders are enabled.</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Phase 3C status</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>Database reporting: <strong>enabled</strong></p>
              <p>Photo storage: <strong>Supabase Storage enabled</strong></p>
              <p>Closure evidence: <strong>enabled</strong></p>
              <p>EHS verification: <strong>enabled</strong></p>
              <p>Dashboard source: <strong>{source}</strong></p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
