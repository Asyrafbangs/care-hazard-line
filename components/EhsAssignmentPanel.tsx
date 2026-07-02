"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, CheckCircle2, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";
import { statusLabel } from "@/lib/status";

type ActionOwnerOption = {
  id: string;
  name: string;
  email: string | null;
  departmentName: string | null;
  ownerLevel: string;
  canReceiveWhatsapp: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  defaultUrgency: UrgencyLevel | null;
  suggestedOwnerDepartment: string | null;
};

type ExistingAssignment = {
  id: string;
  action_owner_id: string;
  action_required: string;
  due_date: string;
  status: string;
  owner_name: string | null;
  owner_email: string | null;
} | null;

const urgencyOptions: Array<{ value: UrgencyLevel; label: string; helper: string }> = [
  { value: "low", label: "Low", helper: "No immediate exposure. Can be planned." },
  { value: "medium", label: "Medium", helper: "Needs action, but no immediate danger." },
  { value: "high", label: "High", helper: "Serious risk. Action should be fast." },
  { value: "urgent", label: "Urgent", helper: "Immediate EHS attention required." }
];

function defaultDueDate(urgency: UrgencyLevel) {
  const date = new Date();
  const days = urgency === "urgent" ? 1 : urgency === "high" ? 3 : urgency === "medium" ? 7 : 14;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function EhsAssignmentPanel({
  reportNo,
  reportStatus,
  aiCategoryName,
  aiUrgency,
  finalUrgency,
  finalCategoryId,
  aiRecommendedImmediateAction,
  aiSuggestedOwnerDepartment,
  actionOwners,
  categories,
  existingAssignment
}: {
  reportNo: string;
  reportStatus: ReportStatus;
  aiCategoryName: string | null;
  aiUrgency: UrgencyLevel | null;
  finalUrgency: UrgencyLevel | null;
  finalCategoryId: string | null;
  aiRecommendedImmediateAction: string | null;
  aiSuggestedOwnerDepartment: string | null;
  actionOwners: ActionOwnerOption[];
  categories: CategoryOption[];
  existingAssignment: ExistingAssignment;
}) {
  const router = useRouter();
  const initialUrgency = finalUrgency ?? aiUrgency ?? "medium";
  const suggestedCategory = useMemo(() => {
    if (finalCategoryId) return finalCategoryId;
    if (!aiCategoryName) return "";
    const lower = aiCategoryName.toLowerCase();
    return categories.find((category) => category.name.toLowerCase() === lower)?.id ?? "";
  }, [aiCategoryName, categories, finalCategoryId]);

  const [finalUrgencyValue, setFinalUrgencyValue] = useState<UrgencyLevel>(initialUrgency);
  const [categoryId, setCategoryId] = useState(suggestedCategory);
  const [actionOwnerId, setActionOwnerId] = useState(existingAssignment?.action_owner_id ?? actionOwners[0]?.id ?? "");
  const [actionRequired, setActionRequired] = useState(existingAssignment?.action_required ?? aiRecommendedImmediateAction ?? "Review the reported hazard, remove the unsafe condition, and provide close-out evidence.");
  const [dueDate, setDueDate] = useState(existingAssignment?.due_date ?? defaultDueDate(initialUrgency));
  const [ehsComment, setEhsComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleUrgencyChange(value: UrgencyLevel) {
    setFinalUrgencyValue(value);
    if (!existingAssignment?.due_date) {
      setDueDate(defaultDueDate(value));
    }
  }

  async function submitAssignment() {
    setMessage(null);

    if (!actionOwnerId) {
      setMessage({ type: "error", text: "Please select an action owner." });
      return;
    }

    if (!actionRequired.trim()) {
      setMessage({ type: "error", text: "Please write the required action." });
      return;
    }

    if (!dueDate) {
      setMessage({ type: "error", text: "Please set a due date." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportNo,
          finalUrgency: finalUrgencyValue,
          finalCategoryId: categoryId || null,
          actionOwnerId,
          actionRequired,
          dueDate,
          ehsComment: ehsComment || null,
          assignedByUserId: null
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Assignment could not be saved.");
      }

      setMessage({ type: "success", text: `Action assigned successfully. Report status is now ${statusLabel("assigned")}.` });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unknown assignment error." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserCheck size={20} />EHS decision</h2>
          <p className="mt-2 text-sm text-slate-600">Confirm the risk, assign the owner, and set the due date. Reporter identity is never sent to the action owner.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{statusLabel(reportStatus)}</span>
      </div>

      {existingAssignment ? (
        <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-100">
          Current assignment: <strong>{existingAssignment.owner_name ?? "Action owner"}</strong>, due <strong>{existingAssignment.due_date}</strong>, status <strong>{existingAssignment.status}</strong>.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Final urgency</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {urgencyOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleUrgencyChange(item.value)}
                className={`rounded-2xl border p-3 text-left transition ${finalUrgencyValue === item.value ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700 hover:border-safety-green/40"}`}
              >
                <span className="font-bold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.helper}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Final category</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green">
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Action owner</span>
            <select value={actionOwnerId} onChange={(event) => setActionOwnerId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green">
              <option value="">Select owner</option>
              {actionOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} · {owner.departmentName ?? owner.ownerLevel}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Required action</span>
          <textarea value={actionRequired} onChange={(event) => setActionRequired(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Due date</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <CalendarDays size={16} className="text-slate-400" />
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal note</span>
            <input value={ehsComment} onChange={(event) => setEhsComment(event.target.value)} placeholder="Optional internal note" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-safety-green" />
          </label>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-100">
          <div className="flex gap-2"><AlertTriangle size={18} />
            <p><strong>Privacy control:</strong> action owner notification and action owner view must not include reporter name or phone number.</p>
          </div>
        </div>

        {aiSuggestedOwnerDepartment ? (
          <p className="text-xs text-slate-500">Suggested owner/department: <strong>{aiSuggestedOwnerDepartment}</strong></p>
        ) : null}

        {message ? (
          <div className={`rounded-2xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-900 ring-1 ring-green-100" : "bg-red-50 text-red-900 ring-1 ring-red-100"}`}>
            <div className="flex items-center gap-2">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{message.text}</div>
          </div>
        ) : null}

        <Button onClick={submitAssignment} disabled={isSubmitting} className="w-full justify-center gap-2">
          <Send size={18} /> {isSubmitting ? "Saving..." : existingAssignment ? "Update Assignment" : "Assign Action"}
        </Button>
      </div>
    </Card>
  );
}
