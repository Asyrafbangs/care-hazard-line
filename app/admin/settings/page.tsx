import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/Card";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { requireAppRole } from "@/lib/auth";
import { actionOwners, departments, ehsUsers, escalationRules, hazardCategories, locations } from "@/lib/dummy-data";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "master", label: "Master Data" },
  { key: "people", label: "Users & Roles" },
  { key: "rules", label: "Notification Rules" },
  { key: "system", label: "System" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  await requireAppRole(["admin", "ehs"], "/admin/settings");
  const params = searchParams ? await searchParams : {};
  const tab: TabKey = (TABS.some((item) => item.key === params.tab) ? params.tab : "master") as TabKey;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Link href="/ehs/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"><ArrowLeft size={16} />Back to dashboard</Link>

      <div className="space-y-4">
        <ConsoleHeader
          eyebrow="Admin"
          title="Settings"
          description="Master data, users and roles, escalation rules, and system tools."
        />

        <nav className="flex flex-wrap gap-2" aria-label="Settings sections">
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <Link
                key={item.key}
                href={`/admin/settings?tab=${item.key}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                  active ? "bg-blue-800 text-white ring-blue-800" : "bg-white text-slate-600 ring-slate-200 hover:ring-blue-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {tab === "master" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><Table title="Locations" rows={locations.map((item) => [item.area, item.name, item.defaultOwner])} headers={["Area", "Location", "Default owner"]} /></Card>
            <Card><Table title="Departments" rows={departments.map((item) => [item])} headers={["Department"]} /></Card>
            <Card className="lg:col-span-2"><Table title="Hazard Categories" rows={hazardCategories.map((item) => [item.name, item.defaultUrgency, item.examples])} headers={["Category", "Default urgency", "Examples"]} /></Card>
            <Card className="lg:col-span-2">
              <p className="text-sm text-slate-600">Master data is currently managed through the database seed. Ask the administrator to update these records.</p>
            </Card>
          </div>
        ) : null}

        {tab === "people" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Login accounts &amp; roles</h2>
                  <p className="mt-1 text-sm text-slate-600">Register users, change roles, activate/deactivate, and reset passwords.</p>
                </div>
                <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white">
                  Open User Management <ArrowRight size={16} />
                </Link>
              </div>
            </Card>
            <Card><Table title="Action Owners" rows={actionOwners.map((item) => [item.name, item.department, item.role])} headers={["Name", "Department", "Role"]} /></Card>
            <Card><Table title="EHS Users" rows={ehsUsers.map((item) => [item.name, item.email, item.role])} headers={["Name", "Email", "Role"]} /></Card>
          </div>
        ) : null}

        {tab === "rules" ? (
          <Card><Table title="Escalation Rules" rows={escalationRules.map((item) => [item.urgency, `${item.reviewHours}h`, `${item.ownerDueDays}d`, item.escalateTo])} headers={["Urgency", "Review", "Due", "Escalate to"]} /></Card>
        ) : null}

        {tab === "system" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/admin/system-health" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:ring-blue-300">
              <h2 className="text-lg font-bold">System Health</h2>
              <p className="mt-1 text-sm text-slate-600">Build, environment, and connection status.</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800">Open <ArrowRight size={14} /></p>
            </Link>
            <Link href="/dev/whatsapp-simulator" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:ring-blue-300">
              <h2 className="text-lg font-bold">WhatsApp Simulator</h2>
              <p className="mt-1 text-sm text-slate-600">Admin only. Test the WhatsApp bot conversation.</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800">Open <ArrowRight size={14} /></p>
            </Link>
            <Link href="/dev/whatsapp-setup" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:ring-blue-300">
              <h2 className="text-lg font-bold">WhatsApp Setup</h2>
              <p className="mt-1 text-sm text-slate-600">Admin only. Connection setup and checks.</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800">Open <ArrowRight size={14} /></p>
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="border-b border-slate-100 py-2 pr-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="border-b border-slate-50 py-2 pr-3 align-top text-slate-700">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
