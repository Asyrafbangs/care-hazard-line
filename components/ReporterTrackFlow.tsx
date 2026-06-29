"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock3, Languages, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { statusLabel } from "@/lib/status";
import type { ReportStatus } from "@/types/domain";

type TrackResult = {
  ok: boolean;
  reporterFound: boolean;
  reporter?: {
    name: string;
    preferredLanguage: string;
  };
  reports: Array<{
    reportNo: string;
    summary: string;
    location: string | null;
    status: ReportStatus;
    urgency: string;
    submittedAt: string;
    closedAt: string | null;
    updatedAt: string;
    assignments: Array<{
      action_required?: string;
      due_date?: string;
      status?: ReportStatus;
    }>;
    history: Array<{
      old_status?: string | null;
      new_status?: ReportStatus;
      comment?: string | null;
      created_at?: string;
    }>;
    notifications: Array<{
      channel?: string;
      template_key?: string;
      message_preview?: string;
      status?: ReportStatus;
      created_at?: string;
    }>;
  }>;
  error?: string;
};

export function ReporterTrackFlow() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reportNo, setReportNo] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchStatus() {
    setError(null);
    setResult(null);

    if (phoneNumber.trim().length < 6) {
      setError("Enter the phone number used when reporting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reports/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, reportNo: reportNo.trim() || null })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not load report status.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown tracking error.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-bold"><Search size={20} /> Check report progress</h2>
        <p className="mt-2 text-sm text-slate-600">Use the phone number captured during reporting. Report ID is optional if you want to see all your recent reports.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Phone number</span>
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-safety-green" placeholder="60123456789" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Report ID optional</span>
            <input value={reportNo} onChange={(event) => setReportNo(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-safety-green" placeholder="HZ-2026-0001" />
          </label>
        </div>
        {error ? <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-900 ring-1 ring-red-100"><AlertTriangle className="mr-2 inline" size={16} />{error}</div> : null}
        <Button onClick={searchStatus} disabled={isLoading} className="mt-5 w-full justify-center gap-2"><Search size={18} /> {isLoading ? "Checking..." : "Check status"}</Button>
      </Card>

      {result && !result.reporterFound ? (
        <Card>
          <h2 className="text-lg font-bold">No report found</h2>
          <p className="mt-2 text-sm text-slate-600">No reporter record was found for this phone number. Check the number or contact EHS.</p>
        </Card>
      ) : null}

      {result?.reporterFound ? (
        <Card>
          <h2 className="text-lg font-bold">Hi {result.reporter?.name ?? "Reporter"}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Languages size={16} /> Preferred language: {result.reporter?.preferredLanguage ?? "en"}</p>
        </Card>
      ) : null}

      {result?.reports.map((report) => (
        <Card key={report.reportNo}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">{report.reportNo}</p>
              <h3 className="mt-1 text-lg font-bold">{report.summary}</h3>
              <p className="mt-2 text-sm text-slate-600">{report.location ?? "Location not set"}</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold capitalize text-safety-green">{report.urgency}</span>
          </div>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <Info label="Current status" value={statusLabel(report.status)} />
            <Info label="Submitted" value={new Date(report.submittedAt).toLocaleString()} />
            <Info label="Last update" value={new Date(report.updatedAt).toLocaleString()} />
          </div>

          {report.assignments[0] ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-bold">Assigned action</p>
              <p className="mt-1">{report.assignments[0].action_required ?? "Action details pending."}</p>
              <p className="mt-2 text-xs text-slate-500">Due: {report.assignments[0].due_date ?? "TBA"} · Status: {statusLabel(report.assignments[0].status ?? report.status)}</p>
            </div>
          ) : null}

          {report.notifications.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-100">
              <p className="flex items-center gap-2 font-bold"><Bell size={16} /> Reporter update</p>
              <p className="mt-1">{report.notifications[0].message_preview}</p>
              <p className="mt-2 text-xs">Channel placeholder: {report.notifications[0].channel} · Status: {report.notifications[0].status}</p>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold"><Clock3 size={16} /> Status history</p>
            {report.history.length > 0 ? report.history.slice(0, 5).map((item, index) => (
              <div key={`${report.reportNo}-${index}`} className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-bold">{statusLabel(item.new_status ?? "submitted")}</p>
                <p className="mt-1">{item.comment ?? "Status updated."}</p>
                <p className="mt-1 text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</p>
              </div>
            )) : <p className="text-sm text-slate-600">No status history yet.</p>}
          </div>

          {report.status === "closed" ? (
            <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-100"><CheckCircle2 className="mr-2 inline" size={16} />This report has been verified and closed by EHS.</div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}
