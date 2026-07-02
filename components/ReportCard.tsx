import Link from "next/link";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";

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
    <Link href={`/ehs/reports/${encodeURIComponent(reportNo)}`} className="block rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-blue-300">
      <article>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500">{reportNo}</p>
            <h3 className="mt-1 text-base font-bold text-safety-ink">{summary}</h3>
          </div>
          <StatusBadge value={urgency} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <p><span className="font-semibold">Location:</span> {location}</p>
          <p><span className="font-semibold">Category:</span> {category}</p>
          <StatusBadge value={status} />
        </div>
        <p className="mt-3 text-xs font-semibold text-blue-800">Open Report →</p>
      </article>
    </Link>
  );
}
