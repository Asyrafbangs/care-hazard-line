import { Card } from "@/components/Card";
import { actionOwners, departments, ehsUsers, escalationRules, hazardCategories, locations } from "@/lib/dummy-data";

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-safety-green">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Master Data Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Phase 1 uses dummy master data. Replace records through Supabase seed or future admin forms.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><Table title="Locations" rows={locations.map((item) => [item.area, item.name, item.defaultOwner])} headers={["Area", "Location", "Default owner"]} /></Card>
        <Card><Table title="Departments" rows={departments.map((item) => [item])} headers={["Department"]} /></Card>
        <Card><Table title="Hazard Categories" rows={hazardCategories.map((item) => [item.name, item.defaultUrgency, item.examples])} headers={["Category", "Default urgency", "Examples"]} /></Card>
        <Card><Table title="Action Owners" rows={actionOwners.map((item) => [item.name, item.department, item.role])} headers={["Name", "Department", "Role"]} /></Card>
        <Card><Table title="EHS Users" rows={ehsUsers.map((item) => [item.name, item.email, item.role])} headers={["Name", "Email", "Role"]} /></Card>
        <Card><Table title="Escalation Rules" rows={escalationRules.map((item) => [item.urgency, `${item.reviewHours}h`, `${item.ownerDueDays}d`, item.escalateTo])} headers={["Urgency", "Review", "Due", "Escalate to"]} /></Card>
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
