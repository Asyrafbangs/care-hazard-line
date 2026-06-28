"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { statusLabel } from "@/lib/status";
import type { ReportStatus } from "@/types/domain";

const statusOptions = [
  {
    value: "in_progress",
    label: "In progress",
    helper: "Use this when work has started but closure evidence is not ready yet."
  },
  {
    value: "pending_verification",
    label: "Ready for EHS verification",
    helper: "Use this when the action is completed and EHS needs to verify."
  }
] as const;

type ActionStatus = typeof statusOptions[number]["value"];

export function ActionOwnerUpdatePanel({
  assignmentId,
  currentAssignmentStatus,
  currentReportStatus
}: {
  assignmentId: string;
  currentAssignmentStatus: string;
  currentReportStatus: ReportStatus;
}) {
  const router = useRouter();
  const defaultStatus: ActionStatus = currentAssignmentStatus === "pending_verification" ? "pending_verification" : "in_progress";
  const [status, setStatus] = useState<ActionStatus>(defaultStatus);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submitUpdate() {
    setMessage(null);

    if (comment.trim().length < 3) {
      setMessage({ type: "error", text: "Please add a short update comment." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/actions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status, comment, updatedByUserId: null })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Action update could not be saved.");
      }

      setMessage({
        type: "success",
        text: status === "pending_verification"
          ? "Submitted to EHS for verification."
          : "Progress update saved."
      });
      setComment("");
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unknown action update error." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Action owner update</h2>
          <p className="mt-2 text-sm text-slate-600">Update action progress without seeing reporter identity. Closure photo upload will be added in the next phase.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {statusLabel(currentReportStatus)}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-100">
        <div className="flex gap-2"><AlertTriangle size={18} />
          <p><strong>Privacy:</strong> do not ask for reporter name or phone number. Contact EHS if clarification is needed.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Update status</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {statusOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`rounded-2xl border p-3 text-left transition ${status === item.value ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700 hover:border-safety-green/40"}`}
              >
                <span className="font-bold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.helper}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Example: Walkway cleared and temporary barricade installed. Permanent marking planned tomorrow."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green"
          />
        </label>

        {message ? (
          <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
            <div className="flex items-center gap-2">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{message.text}</div>
          </div>
        ) : null}

        <Button onClick={submitUpdate} disabled={isSubmitting || ["closed", "cancelled"].includes(currentAssignmentStatus)} className="w-full justify-center">
          <Send size={18} /> {isSubmitting ? "Saving update..." : status === "pending_verification" ? "Submit for EHS verification" : "Save progress update"}
        </Button>
      </div>
    </Card>
  );
}
