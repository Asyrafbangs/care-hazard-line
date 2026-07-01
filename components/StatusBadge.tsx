const STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-100",
  submitted: "bg-blue-50 text-blue-700 ring-blue-100",
  ehs_review: "bg-blue-50 text-blue-700 ring-blue-100",
  assigned: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-100",
  pending_verification: "bg-purple-50 text-purple-700 ring-purple-100",
  closed: "bg-green-50 text-green-700 ring-green-100",
  reopened: "bg-orange-50 text-orange-800 ring-orange-100",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  overdue: "bg-red-50 text-red-700 ring-red-100",
  urgent: "bg-red-50 text-red-700 ring-red-100",
  high: "bg-orange-50 text-orange-800 ring-orange-100",
  medium: "bg-amber-50 text-amber-800 ring-amber-100",
  low: "bg-slate-100 text-slate-700 ring-slate-200"
};

const LABELS: Record<string, string> = {
  new: "New",
  submitted: "Submitted",
  ehs_review: "Under EHS review",
  assigned: "Assigned",
  in_progress: "In progress",
  pending_verification: "Pending verification",
  closed: "Closed",
  reopened: "Reopened",
  cancelled: "Cancelled",
  overdue: "Overdue",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low"
};

export function StatusBadge({ value, label, className = "" }: { value: string; label?: string; className?: string }) {
  const key = value?.toLowerCase?.() ?? "";
  const style = STYLES[key] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${style} ${className}`}>
      {label ?? LABELS[key] ?? value}
    </span>
  );
}
