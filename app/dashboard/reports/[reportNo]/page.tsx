import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, LockKeyhole, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/Card";
import { SecurePhotoPreview } from "@/components/SecurePhotoPreview";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { statusLabel } from "@/lib/status";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const dynamic = "force-dynamic";

type ReportDetail = {
  id: string;
  report_no: string;
  original_description: string;
  translated_description: string | null;
  location_text: string | null;
  location_area: string | null;
  location_name: string | null;
  ai_hazard_summary: string | null;
  ai_category_name: string | null;
  ai_urgency: UrgencyLevel | null;
  final_urgency: UrgencyLevel | null;
  ai_recommended_immediate_action: string | null;
  ai_suggested_owner_department: string | null;
  ai_status: string;
  reporter_confirmed_ai_summary: boolean;
  status: ReportStatus;
  submitted_at: string | null;
  created_at: string;
  reporter_name: string;
  reporter_phone_number: string;
  reporter_category: string;
  employee_id: string | null;
  company_name: string | null;
  preferred_language: string;
};

type PhotoRow = {
  id: string;
  photo_type: "hazard" | "closure" | "verification";
  storage_provider: string | null;
  supabase_bucket: string | null;
  supabase_storage_path: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

async function getReport(reportNo: string): Promise<{ report: ReportDetail | null; photos: PhotoRow[]; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();

    const { data: report, error } = await supabase
      .from("ehs_report_detail")
      .select("*")
      .eq("report_no", reportNo)
      .maybeSingle();

    if (error) {
      return { report: null, photos: [], error: error.message };
    }

    if (!report) {
      return { report: null, photos: [], error: "Report not found." };
    }

    const { data: photos, error: photoError } = await supabase
      .from("hazard_photos")
      .select("id, photo_type, storage_provider, supabase_bucket, supabase_storage_path, original_file_name, mime_type, size_bytes, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    return {
      report: report as ReportDetail,
      photos: (photos ?? []) as PhotoRow[],
      error: photoError?.message
    };
  } catch (error) {
    return { report: null, photos: [], error: error instanceof Error ? error.message : "Unknown report loading error." };
  }
}

export default async function ReportDetailPage({ params }: { params: Promise<{ reportNo: string }> }) {
  const { reportNo } = await params;
  const decodedReportNo = decodeURIComponent(reportNo);
  const { report, photos, error } = await getReport(decodedReportNo);

  if (!report) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green"><ArrowLeft size={16} />Back to dashboard</Link>
        <Card>
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className="mt-2 text-sm text-slate-600">{error ?? "The report could not be loaded."}</p>
        </Card>
      </main>
    );
  }

  const urgency = report.final_urgency ?? report.ai_urgency ?? "medium";
  const location = report.location_name ? `${report.location_area ?? ""} - ${report.location_name}` : report.location_text ?? "Location not set";
  const hazardPhoto = photos.find((photo) => photo.photo_type === "hazard" && photo.supabase_storage_path);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green"><ArrowLeft size={16} />Back to dashboard</Link>

      <header className="mb-6 rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">EHS secure report detail</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{report.report_no}</h1>
            <p className="mt-2 max-w-3xl text-sm text-green-50">{report.ai_hazard_summary ?? report.original_description}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold capitalize">{urgency}</div>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
          Photo/data warning: {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><AlertTriangle size={20} />Hazard review</div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label="Status" value={statusLabel(report.status)} />
              <Info label="Location" value={location} icon={<MapPin size={15} />} />
              <Info label="Original description" value={report.original_description} />
              <Info label="AI summary" value={report.ai_hazard_summary ?? "Pending EHS review"} />
              <Info label="Suggested category" value={report.ai_category_name ?? "Pending category"} />
              <Info label="Recommended immediate action" value={report.ai_recommended_immediate_action ?? "EHS to review"} />
              <Info label="Suggested owner / department" value={report.ai_suggested_owner_department ?? "EHS review required"} />
              <Info label="Reporter confirmed AI summary" value={report.reporter_confirmed_ai_summary ? "Yes" : "No"} icon={<CheckCircle2 size={15} />} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><UserRound size={20} />Reporter details visible to EHS</div>
            <p className="mt-2 text-sm text-slate-600">This panel uses the EHS view. Action owner screens must use the privacy-safe view and must not show reporter name or phone number.</p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <Info label="Name" value={report.reporter_name} />
              <Info label="Phone" value={report.reporter_phone_number} icon={<Phone size={15} />} />
              <Info label="Category" value={report.reporter_category} />
              <Info label="Employee ID / Company" value={report.employee_id ?? report.company_name ?? "Not provided"} />
              <Info label="Preferred language" value={report.preferred_language} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><LockKeyhole size={20} />Photo access control</div>
            <p className="mt-2 text-sm text-slate-600">Photo files are stored in a private Supabase Storage bucket. The page does not store or expose permanent public image links.</p>
          </Card>

          {hazardPhoto ? (
            <SecurePhotoPreview
              reportNo={report.report_no}
              photoId={hazardPhoto.id}
              photoType="hazard"
              viewerRole="ehs"
              fileName={hazardPhoto.original_file_name}
            />
          ) : (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} />No secure photo available</h2>
              <p className="mt-2 text-sm text-slate-600">This report may have been created before Phase 2B Supabase Storage upload was enabled.</p>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-bold">Stored photo records</h2>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              {photos.length > 0 ? photos.map((photo) => (
                <div key={photo.id} className="rounded-2xl bg-slate-50 p-3">
                  <p><strong>Type:</strong> {photo.photo_type}</p>
                  <p><strong>Provider:</strong> {photo.storage_provider ?? "not set"}</p>
                  <p><strong>File:</strong> {photo.original_file_name ?? "not set"}</p>
                  <p className="break-all"><strong>Path:</strong> {photo.supabase_storage_path ?? "not set"}</p>
                </div>
              )) : <p>No photo records found.</p>}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">{icon}{label}</p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}
