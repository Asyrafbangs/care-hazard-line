"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PhotoUploadCard } from "@/components/PhotoUploadCard";
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
    helper: "Use this only after the action is completed and closure evidence is attached."
  }
] as const;

type ActionStatus = typeof statusOptions[number]["value"];

type EvidenceUploadResponse = {
  ok: boolean;
  provider?: "supabase";
  bucket?: string;
  path?: string;
  signedUrl?: string | null;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  error?: string;
};

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
  const [closurePhotoFile, setClosurePhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function uploadClosureEvidence(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/storage/action-evidence", {
      method: "POST",
      body: formData
    });

    const result = (await response.json()) as EvidenceUploadResponse;

    if (!response.ok || !result.ok || !result.bucket || !result.path || !result.originalFileName || !result.mimeType || !result.sizeBytes) {
      throw new Error(result.error ?? "Closure evidence upload failed.");
    }

    return {
      provider: "supabase" as const,
      bucket: result.bucket,
      path: result.path,
      signedUrl: result.signedUrl ?? null,
      originalFileName: result.originalFileName,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes
    };
  }

  async function submitUpdate() {
    setMessage(null);

    if (comment.trim().length < 3) {
      setMessage({ type: "error", text: "Please add a short update comment." });
      return;
    }

    if (status === "pending_verification" && !closurePhotoFile) {
      setMessage({ type: "error", text: "Please attach closure evidence before submitting to EHS verification." });
      return;
    }

    setIsSubmitting(true);
    try {
      const closurePhoto = status === "pending_verification" && closurePhotoFile
        ? await uploadClosureEvidence(closurePhotoFile)
        : null;

      const response = await fetch("/api/actions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status, comment, updatedByUserId: null, closurePhoto })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Action update could not be saved.");
      }

      setMessage({
        type: "success",
        text: status === "pending_verification"
          ? "Closure evidence submitted to EHS for verification."
          : "Progress update saved."
      });
      setComment("");
      setClosurePhotoFile(null);
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unknown action update error." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLocked = ["closed", "cancelled"].includes(currentAssignmentStatus);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Action owner update</h2>
          <p className="mt-2 text-sm text-slate-600">Update action progress. Closure evidence is mandatory before sending the action to EHS verification.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {statusLabel(currentReportStatus)}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500">Reporter hidden for privacy. Contact EHS if clarification is needed.</p>

      <div className="mt-5 grid gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Update status</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {statusOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                disabled={isLocked}
                className={`rounded-2xl border p-3 text-left transition ${status === item.value ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700 hover:border-safety-green/40"}`}
              >
                <span className="font-bold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.helper}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress / closure comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            disabled={isLocked}
            placeholder="Example: Walkway cleared, pallets relocated to marked area, and temporary barricade removed."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green"
          />
        </label>

        {status === "pending_verification" ? (
          <PhotoUploadCard
            label="Closure photo"
            file={closurePhotoFile}
            onChange={setClosurePhotoFile}
            required
            error={!closurePhotoFile ? "Required before submitting to EHS verification." : undefined}
          />
        ) : null}

        {message ? (
          <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
            <div className="flex items-center gap-2">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{message.text}</div>
          </div>
        ) : null}

        <Button onClick={submitUpdate} disabled={isSubmitting || isLocked} className="w-full justify-center gap-2">
          <Send size={18} /> {isSubmitting ? "Saving..." : status === "pending_verification" ? "Submit to EHS Verification" : "Save Progress"}
        </Button>
      </div>
    </Card>
  );
}
