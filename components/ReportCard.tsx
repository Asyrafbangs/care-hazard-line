import type { ReportStatus, UrgencyLevel } from "@/types/domain";
import { statusLabel } from "@/lib/status";

const urgencyStyle: Record<UrgencyLevel, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export function ReportCard({
  reportNo,
  summary,
  location,
  category,
  urgency,
  status
}: {
  reportNo: string;
  summary: string;
  location: string;
  category: string;
  urgency: UrgencyLevel;
  status: ReportStatus;
}) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{reportNo}</p>
          <h3 className="mt-1 text-base font-bold text-safety-ink">{summary}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${urgencyStyle[urgency]}`}>{urgency}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <p><span className="font-semibold">Location:</span> {location}</p>
        <p><span className="font-semibold">Category:</span> {category}</p>
        <p className="col-span-2"><span className="font-semibold">Status:</span> {statusLabel(status)}</p>
      </div>
    </article>
  );
}
