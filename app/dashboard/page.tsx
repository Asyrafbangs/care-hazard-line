import Link from "next/link";
import { Bell, Filter, Settings } from "lucide-react";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { ReportCard } from "@/components/ReportCard";
import { sampleReports } from "@/lib/dummy-data";

export default function DashboardPage() {
  const urgent = sampleReports.filter((report) => report.urgency === "urgent" || report.urgency === "high").length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-safety-green p-6 text-white shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">EHS Console</p>
          <h1 className="mt-2 text-3xl font-bold">CARE Hazard Dashboard</h1>
          <p className="mt-2 text-sm text-green-50">Demo data is used in Phase 1. Replace using Supabase seed data later.</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold" href="/admin/settings"><Settings className="mr-2 inline" size={16} />Settings</Link>
          <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-safety-green" href="/reports/new">New Report</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="New reports" value="8" note="Waiting EHS review" />
        <MetricCard label="Urgent / High" value={urgent} note="Immediate EHS alert" />
        <MetricCard label="Open actions" value="21" note="Assigned or in progress" />
        <MetricCard label="Overdue" value="5" note="Escalation needed" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Priority queue</h2>
            <button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><Filter className="mr-2 inline" size={16} />Filter</button>
          </div>
          {sampleReports.map((report) => (
            <ReportCard key={report.reportNo} {...report} />
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Bell size={18} /> Alerts</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="rounded-2xl bg-red-50 p-3 text-red-800">High-risk reports should notify EHS immediately.</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-800">Action owner visibility excludes reporter name and phone number.</p>
              <p className="rounded-2xl bg-green-50 p-3 text-green-800">Closure update will be sent to reporter in Phase 5.</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Hotspot preview</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div><span className="font-semibold">Warehouse</span><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-safety-green" /></div></div>
              <div><span className="font-semibold">Loading Area</span><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 w-3/5 rounded-full bg-safety-green" /></div></div>
              <div><span className="font-semibold">Paintshop</span><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 w-2/5 rounded-full bg-safety-green" /></div></div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
