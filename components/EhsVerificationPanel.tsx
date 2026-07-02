"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { statusLabel } from "@/lib/status";
import type { ReportStatus } from "@/types/domain";

export function EhsVerificationPanel({
  reportNo,
  assignmentId,
  reportStatus,
  assignmentStatus
}: {
  reportNo: string;
  assignmentId: string;
  reportStatus: ReportStatus;
  assignmentStatus: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"close" | "reopen">("close");
  const [reopenReason, setReopenReason] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submitVerification() {
    setMessage(null);

    if (decision === "reopen" && !reopenReason) {
      setMessage({ type: "error", text: "Please select a reopen reason." });
      return;
    }

    if (comment.trim().length < 3) {
      setMessage({ type: "error", text: "Please add a verification comment." });
      return;
    }

    // Reopen reason is stored as part of the verification comment so no
    // database change is required.
    const finalComment = decision === "reopen" ? `Reopen reason: ${reopenReason}. ${comment}` : comment;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportNo, assignmentId, decision, comment: finalComment, verifiedByUserId: null })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Verification could not be saved.");
      }

      setMessage({
        type: "success",
        text: decision === "close" ? "Report closed after EHS verification." : "Action reopened for rework."
      });
      setComment("");
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unknown verification error." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const canVerify = assignmentStatus === "pending_verification" && reportStatus === "pending_verification";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} />EHS verification</h2>
          <p className="mt-2 text-sm text-slate-600">Review the action owner comment and closure evidence. Close only when the control is effective.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{statusLabel(reportStatus)}</span>
      </div>

      {!canVerify ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          Verification is available only when the action is pending EHS verification. Current action status: <strong>{statusLabel(assignmentStatus as ReportStatus)}</strong>.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Verification decision</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canVerify || isSubmitting}
              onClick={() => setDecision("close")}
              className={`rounded-2xl border p-3 text-left transition ${decision === "close" ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700 hover:border-safety-green/40"}`}
            >
              <span className="flex items-center gap-2 font-bold"><CheckCircle2 size={17} /> Accept Closure</span>
              <span className="mt-1 block text-xs text-slate-500">Use this when evidence is sufficient and hazard is controlled.</span>
            </button>
            <button
              type="button"
              disabled={!canVerify || isSubmitting}
              onClick={() => setDecision("reopen")}
              className={`rounded-2xl border p-3 text-left transition ${decision === "reopen" ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"}`}
            >
              <span className="flex items-center gap-2 font-bold"><RotateCcw size={17} /> Reopen Action</span>
              <span className="mt-1 block text-xs text-slate-500">Use this when further action or better evidence is needed.</span>
            </button>
          </div>
        </div>

        {decision === "reopen" ? (
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Reopen reason <span className="text-safety-red">*</span></span>
            <select
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              disabled={!canVerify || isSubmitting}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green"
            >
              <option value="">Select a reason</option>
              <option value="Evidence insufficient">Evidence insufficient</option>
              <option value="Action not completed">Action not completed</option>
              <option value="Wrong corrective action">Wrong corrective action</option>
              <option value="Additional control required">Additional control required</option>
              <option value="Other">Other</option>
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">EHS verification comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            disabled={!canVerify || isSubmitting}
            placeholder={decision === "close" ? "Example: Walkway cleared. Storage relocated and access route is now clear." : "Example: Action not sufficient. Please add permanent floor marking and re-submit evidence."}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green"
          />
        </label>

        {message ? (
          <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
            <div className="flex items-center gap-2">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{message.text}</div>
          </div>
        ) : null}

        <Button onClick={submitVerification} disabled={!canVerify || isSubmitting} variant={decision === "reopen" ? "danger" : "primary"} className="w-full justify-center gap-2">
          {decision === "close" ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
          {isSubmitting ? "Saving..." : decision === "close" ? "Accept Closure" : "Reopen Action"}
        </Button>
      </div>
    </Card>
  );
}
