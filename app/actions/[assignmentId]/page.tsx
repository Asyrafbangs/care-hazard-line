import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { SecurePhotoPreview } from "@/components/SecurePhotoPreview";
import { ActionOwnerUpdatePanel } from "@/components/ActionOwnerUpdatePanel";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { statusLabel } from "@/lib/status";
import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const dynamic = "force-dynamic";

type ActionDetail = {
  id: string;
  report_no: string;
  original_description: string;
  translated_description: string | null;
  location_area: string | null;
  location_name: string | null;
  location_text: string | null;
  ai_hazard_summary: string | null;
  ai_category_name: string | null;
  ai_urgency: UrgencyLevel | null;
  final_urgency: UrgencyLevel | null;
  status: ReportStatus;
  created_at: string;
  assignment_id: string;
  action_required: string;
  due_date: string;
  assignment_status: ReportStatus;
  action_owner_id: string;
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

type ActionUpdateRow = {
  id: string;
  status: ReportStatus;
  comment: string | null;
  created_at: string;
};

async function getActionDetail(assignmentId: string): Promise<{ action: ActionDetail | null; photos: PhotoRow[]; updates: ActionUpdateRow[]; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();

    const { data: action, error } = await supabase
      .from("action_owner_report_detail")
      .select("id, report_no, original_description, translated_description, location_area, location_name, location_text, ai_hazard_summary, ai_category_name, ai_urgency, final_urgency, status, created_at, assignment_id, action_required, due_date, assignment_status, action_owner_id")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      return { action: null, photos: [], updates: [], error: error.message };
    }

    if (!action) {
      return { action: null, photos: [], updates: [], error: "Assignment not found." };
    }

    const { data: photos, error: photoError } = await supabase
      .from("hazard_photos")
      .select("id, photo_type, storage_provider, supabase_bucket, supabase_storage_path, original_file_name, mime_type, size_bytes, created_at")
      .eq("report_id", action.id)
      .order("created_at", { ascending: true });

    const { data: updates, error: updateError } = await supabase
      .from("action_updates")
      .select("id, status, comment, created_at")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false });

    return {
      action: action as ActionDetail,
      photos: (photos ?? []) as PhotoRow[],
      updates: (updates ?? []) as ActionUpdateRow[],
      error: photoError?.message ?? updateError?.message
    };
  } catch (error) {
    return {
      action: null,
      photos: [],
      updates: [],
      error: error instanceof Error ? error.message : "Unknown action detail error."
    };
  }
}

export default async function ActionDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const { action, photos, updates, error } = await getActionDetail(assignmentId);

  if (!action) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
        <Link href="/actions" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green"><ArrowLeft size={16} />Back to actions</Link>
        <Card>
          <h1 className="text-2xl font-bold">Action not found</h1>
          <p className="mt-2 text-sm text-slate-600">{error ?? "The action could not be loaded."}</p>
        </Card>
      </main>
    );
  }

  const urgency = action.final_urgency ?? action.ai_urgency ?? "medium";
  const location = action.location_name ? `${action.location_area ?? ""} - ${action.location_name}` : action.location_text ?? "Location not set";
  const hazardPhoto = photos.find((photo) => photo.photo_type === "hazard" && photo.supabase_storage_path);
  const closurePhotos = photos.filter((photo) => photo.photo_type === "closure" && photo.supabase_storage_path);
  const isOverdue = new Date(action.due_date) < new Date() && !["closed", "cancelled"].includes(action.assignment_status);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Link href={`/actions?ownerId=${action.action_owner_id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green"><ArrowLeft size={16} />Back to actions</Link>

      <header className="mb-6 rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">Privacy-safe action detail</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{action.report_no}</h1>
            <p className="mt-2 max-w-3xl text-sm text-green-50">{action.ai_hazard_summary ?? action.original_description}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold capitalize">{urgency}</div>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
          Action detail warning: {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><AlertTriangle size={20} />Hazard and assigned action</div>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label="Report status" value={statusLabel(action.status)} />
              <Info label="Action status" value={statusLabel(action.assignment_status)} />
              <Info label="Location" value={location} icon={<MapPin size={15} />} />
              <Info label="Category" value={action.ai_category_name ?? "Pending category"} />
              <Info label="Hazard description" value={action.ai_hazard_summary ?? action.original_description} />
              <Info label="Required action" value={action.action_required} icon={<CheckCircle2 size={15} />} />
              <Info label="Due date" value={`${action.due_date}${isOverdue ? " · Overdue" : ""}`} icon={<CalendarDays size={15} />} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><LockKeyhole size={20} />Reporter privacy</div>
            <p className="mt-2 text-sm text-slate-600">This page uses the action-owner privacy view. Reporter name, phone number, employee ID, and visitor company are not loaded here.</p>
          </Card>

          <ActionOwnerUpdatePanel
            assignmentId={action.assignment_id}
            currentAssignmentStatus={action.assignment_status}
            currentReportStatus={action.status}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} />Photo evidence</div>
            <p className="mt-2 text-sm text-slate-600">Action owner can view hazard evidence through a temporary signed URL. Reporter details remain hidden.</p>
          </Card>

          {hazardPhoto ? (
            <SecurePhotoPreview
              reportNo={action.report_no}
              photoId={hazardPhoto.id}
              photoType="hazard"
              viewerRole="action_owner"
              fileName={hazardPhoto.original_file_name}
            />
          ) : (
            <Card>
              <h2 className="text-lg font-bold">No hazard photo available</h2>
              <p className="mt-2 text-sm text-slate-600">This report may have been created before Supabase Storage upload was enabled.</p>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-bold">Closure evidence</h2>
            <p className="mt-2 text-sm text-slate-600">Closure evidence uploaded by the action owner is stored privately and can be viewed with a temporary signed URL.</p>
          </Card>

          {closurePhotos.length > 0 ? closurePhotos.map((photo) => (
            <SecurePhotoPreview
              key={photo.id}
              reportNo={action.report_no}
              photoId={photo.id}
              photoType="closure"
              viewerRole="action_owner"
              fileName={photo.original_file_name}
            />
          )) : (
            <Card>
              <h2 className="text-lg font-bold">No closure evidence yet</h2>
              <p className="mt-2 text-sm text-slate-600">Closure evidence will appear here after the action owner submits the action for EHS verification.</p>
            </Card>
          )}

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Clock3 size={18} />Update history</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {updates.length > 0 ? updates.map((update) => (
                <div key={update.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-bold capitalize">{statusLabel(update.status)}</p>
                  <p className="mt-1 text-slate-600">{update.comment ?? "No comment."}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(update.created_at).toLocaleString()}</p>
                </div>
              )) : <p>No owner updates yet.</p>}
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
