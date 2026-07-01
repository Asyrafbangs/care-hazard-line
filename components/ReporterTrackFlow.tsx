"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, Check, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import type { ReportStatus } from "@/types/domain";

type TrackReport = {
  reportNo: string;
  summary: string;
  location: string | null;
  status: ReportStatus;
  urgency: string;
  submittedAt: string;
  closedAt: string | null;
  updatedAt: string;
};

type TrackResult = {
  ok: boolean;
  reporterFound: boolean;
  reporter?: { name: string; preferredLanguage: string };
  reports: TrackReport[];
};

const STAGES: { key: string; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "ehs_review", label: "Under EHS review" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "pending_verification", label: "Pending verification" },
  { key: "closed", label: "Closed" }
];

function stageIndex(status: string): number {
  const map: Record<string, number> = {
    submitted: 0,
    ehs_review: 1,
    assigned: 2,
    in_progress: 3,
    reopened: 3,
    pending_verification: 4,
    closed: 5
  };
  return map[status] ?? 0;
}

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
      setError("Enter the phone number you used when reporting.");
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
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not load report status.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report status.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setReportNo("");
  }

  return (
    <div className="space-y-4">
      {!result ? (
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><Search size={20} /> Check report status</h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter the phone number you reported with — with or without the country code (e.g. 60123456789 or 0123456789).
            Add your report ID to see one specific report.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Phone number <span className="text-safety-red">*</span>
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                placeholder="60123456789"
                inputMode="tel"
              />
            </label>
            <label className="block text-sm font-semibold">
              Report ID <span className="text-xs font-normal text-slate-400">optional</span>
              <input
                value={reportNo}
                onChange={(event) => setReportNo(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal uppercase outline-none focus:border-safety-green"
                placeholder="HZ-2026-0001"
              />
            </label>
          </div>
          {error ? (
            <p className="mt-4 flex items-center gap-1 rounded-2xl bg-red-50 p-3 text-sm text-red-700"><AlertTriangle size={15} /> {error}</p>
          ) : null}
          <Button onClick={searchStatus} disabled={isLoading} className="mt-5 w-full justify-center gap-2">
            <Search size={18} /> {isLoading ? "Checking..." : "Check status"}
          </Button>
        </Card>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {result.reporterFound ? `Showing reports for ${result.reporter?.name ?? "you"}.` : "No matching reports."}
          </p>
          <button onClick={reset} className="text-sm font-semibold text-safety-green underline">Search again</button>
        </div>
      )}

      {result && !result.reporterFound ? (
        <EmptyState
          title="No report found"
          description="We could not find a report for that phone number. Check the number, or contact EHS."
          action={
            <Link href="/reports/new" className="inline-flex items-center gap-2 rounded-2xl bg-safety-green px-4 py-2.5 text-sm font-bold text-white">
              <Camera size={16} /> Report a hazard
            </Link>
          }
        />
      ) : null}

      {result?.reports.map((report) => {
        const current = stageIndex(report.status);
        const cancelled = report.status === "cancelled";
        return (
          <Card key={report.reportNo}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">{report.reportNo}</p>
                <h3 className="mt-1 text-lg font-bold text-safety-ink">{report.summary}</h3>
                <p className="mt-1 text-sm text-slate-600">{report.location ?? "Location not set"}</p>
              </div>
              <StatusBadge value={report.status} />
            </div>

            {cancelled ? (
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">This report was cancelled.</p>
            ) : (
              <ol className="mt-5">
                {STAGES.map((stage, index) => {
                  const done = index < current;
                  const isCurrent = index === current;
                  const isLast = index === STAGES.length - 1;
                  return (
                    <li key={stage.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${done || isCurrent ? "bg-safety-green" : "bg-slate-200"}`}>
                          {done ? <Check size={13} /> : isCurrent ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                        </span>
                        {!isLast ? <span className={`w-0.5 flex-1 ${index < current ? "bg-safety-green" : "bg-slate-200"}`} style={{ minHeight: 22 }} /> : null}
                      </div>
                      <div className={`pb-4 ${isCurrent ? "font-bold text-safety-ink" : done ? "text-slate-600" : "text-slate-400"}`}>
                        <p className="text-sm">{stage.label}</p>
                        {isCurrent ? <p className="text-xs font-normal text-slate-500">Current status</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="mt-1 text-xs text-slate-400">Last update: {new Date(report.updatedAt).toLocaleString()}</p>
          </Card>
        );
      })}
    </div>
  );
}
