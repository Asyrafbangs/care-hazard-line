import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, Phone, UserRound } from "lucide-react";
import { Card } from "@/components/Card";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { SecurePhotoPreview } from "@/components/SecurePhotoPreview";
import { EhsAssignmentPanel } from "@/components/EhsAssignmentPanel";
import { EhsVerificationPanel } from "@/components/EhsVerificationPanel";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAppRole } from "@/lib/auth";
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
  final_category_id: string | null;
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

type ActionUpdateRow = {
  id: string;
  status: ReportStatus;
  comment: string | null;
  closure_photo_id: string | null;
  created_at: string;
};

async function getReport(reportNo: string): Promise<{
  report: ReportDetail | null;
  photos: PhotoRow[];
  actionOwners: ActionOwnerOption[];
  categories: CategoryOption[];
  assignment: ExistingAssignment;
  actionUpdates: ActionUpdateRow[];
  error?: string;
}> {
  try {
    const supabase = createSupabaseAdmin();

    const { data: report, error } = await supabase
      .from("ehs_report_detail")
      .select("*")
      .eq("report_no", reportNo)
      .maybeSingle();

    if (error) {
      return { report: null, photos: [], actionOwners: [], categories: [], assignment: null, actionUpdates: [], error: error.message };
    }

    if (!report) {
      return { report: null, photos: [], actionOwners: [], categories: [], assignment: null, actionUpdates: [], error: "Report not found." };
    }

    const { data: photos, error: photoError } = await supabase
      .from("hazard_photos")
      .select("id, photo_type, storage_provider, supabase_bucket, supabase_storage_path, original_file_name, mime_type, size_bytes, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    const { data: categories } = await supabase
      .from("hazard_categories")
      .select("id, name, default_urgency, suggested_owner_department")
      .order("name", { ascending: true });

    const { data: ownerRows } = await supabase
      .from("action_owners")
      .select("id, user_id, owner_level, can_receive_whatsapp")
      .order("created_at", { ascending: true });

    const userIds = (ownerRows ?? []).map((owner) => owner.user_id).filter(Boolean);
    const { data: userRows } = userIds.length > 0
      ? await supabase.from("users").select("id, name, email, department_id").in("id", userIds)
      : { data: [] };

    const departmentIds = (userRows ?? []).map((user) => user.department_id).filter(Boolean);
    const { data: departmentRows } = departmentIds.length > 0
      ? await supabase.from("departments").select("id, name").in("id", departmentIds)
      : { data: [] };

    const usersById = new Map((userRows ?? []).map((user) => [user.id, user]));
    const departmentsById = new Map((departmentRows ?? []).map((department) => [department.id, department]));

    const actionOwners: ActionOwnerOption[] = (ownerRows ?? []).map((owner) => {
      const user = usersById.get(owner.user_id);
      const department = user?.department_id ? departmentsById.get(user.department_id) : null;
      return {
        id: owner.id,
        name: user?.name ?? "Unnamed owner",
        email: user?.email ?? null,
        departmentName: department?.name ?? null,
        ownerLevel: owner.owner_level,
        canReceiveWhatsapp: owner.can_receive_whatsapp
      };
    });

    const { data: assignmentRow } = await supabase
      .from("report_assignments")
      .select("id, action_owner_id, action_required, due_date, status")
      .eq("report_id", report.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const assignmentOwner = assignmentRow ? actionOwners.find((owner) => owner.id === assignmentRow.action_owner_id) : null;

    const { data: actionUpdates } = assignmentRow
      ? await supabase
          .from("action_updates")
          .select("id, status, comment, closure_photo_id, created_at")
          .eq("assignment_id", assignmentRow.id)
          .order("created_at", { ascending: false })
      : { data: [] };

    const assignment: ExistingAssignment = assignmentRow ? {
      id: assignmentRow.id,
      action_owner_id: assignmentRow.action_owner_id,
      action_required: assignmentRow.action_required,
      due_date: assignmentRow.due_date,
      status: assignmentRow.status,
      owner_name: assignmentOwner?.name ?? null,
      owner_email: assignmentOwner?.email ?? null
    } : null;

    return {
      report: report as ReportDetail,
      photos: (photos ?? []) as PhotoRow[],
      actionOwners,
      categories: (categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        defaultUrgency: category.default_urgency as UrgencyLevel | null,
        suggestedOwnerDepartment: category.suggested_owner_department
      })),
      assignment,
      actionUpdates: (actionUpdates ?? []) as ActionUpdateRow[],
      error: photoError?.message
    };
  } catch (error) {
    return {
      report: null,
      photos: [],
      actionOwners: [],
      categories: [],
      assignment: null,
      actionUpdates: [],
      error: error instanceof Error ? error.message : "Unknown report loading error."
    };
  }
}

export default async function ReportDetailPage({ params }: { params: Promise<{ reportNo: string }> }) {
  const { reportNo } = await params;
  await requireAppRole(["admin", "ehs", "hod"], `/ehs/reports/${encodeURIComponent(reportNo)}`);
  const decodedReportNo = decodeURIComponent(reportNo);
  const { report, photos, actionOwners, categories, assignment, actionUpdates, error } = await getReport(decodedReportNo);

  if (!report) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
        <Link href="/ehs/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green"><ArrowLeft size={16} />Back to dashboard</Link>
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
  const closurePhotos = photos.filter((photo) => photo.photo_type === "closure" && photo.supabase_storage_path);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Link href="/ehs/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"><ArrowLeft size={16} />Back to dashboard</Link>

      <div className="space-y-4">
        <ConsoleHeader
          eyebrow="EHS Report Detail"
          title={report.report_no}
          description={report.ai_hazard_summary ?? report.original_description}
          actions={
            <>
              <StatusBadge value={urgency} />
              <StatusBadge value={report.status} />
            </>
          }
        />

        {error ? (
          <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
            Some report data could not be loaded: {error}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: evidence and context */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 text-lg font-bold"><AlertTriangle size={20} />Hazard summary</div>
              <div className="mt-4 grid gap-3 text-sm">
                <Info label="Location" value={location} icon={<MapPin size={15} />} />
                <Info label="Reporter description" value={report.original_description} />
                <Info label="Suggested summary" value={report.ai_hazard_summary ?? "Pending EHS review"} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Suggested category" value={report.ai_category_name ?? "Pending category"} />
                  <Info label="Suggested urgency" value={(report.ai_urgency ?? "medium").toString()} />
                </div>
                <Info label="Suggested immediate action" value={report.ai_recommended_immediate_action ?? "EHS to review"} />
                <Info label="Suggested owner / department" value={report.ai_suggested_owner_department ?? "EHS review required"} />
                <Info label="Reporter confirmed the summary" value={report.reporter_confirmed_ai_summary ? "Yes" : "No"} icon={<CheckCircle2 size={15} />} />
              </div>
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
                <h2 className="text-lg font-bold">No hazard photo</h2>
                <p className="mt-2 text-sm text-slate-600">This report has no photo on record.</p>
              </Card>
            )}

            <Card>
              <div className="flex items-center gap-2 text-lg font-bold"><UserRound size={20} />Reporter details</div>
              <p className="mt-2 text-sm text-slate-600">Visible to EHS only. Action owners never see the reporter&rsquo;s name or phone number.</p>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Info label="Name" value={report.reporter_name} />
                <Info label="Phone" value={report.reporter_phone_number} icon={<Phone size={15} />} />
                <Info label="Category" value={report.reporter_category} />
                <Info label="Employee ID / Company" value={report.employee_id ?? report.company_name ?? "Not provided"} />
              </div>
            </Card>

            {closurePhotos.length > 0 ? (
              <Card>
                <h2 className="text-lg font-bold">Closure evidence</h2>
                <p className="mt-2 text-sm text-slate-600">Review the closure photos before accepting or reopening the action.</p>
              </Card>
            ) : null}
            {closurePhotos.map((photo) => (
              <SecurePhotoPreview
                key={photo.id}
                reportNo={report.report_no}
                photoId={photo.id}
                photoType="closure"
                viewerRole="ehs"
                fileName={photo.original_file_name}
              />
            ))}

            <Card>
              <h2 className="text-lg font-bold">Timeline</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {actionUpdates.length > 0 ? actionUpdates.map((update) => (
                  <div key={update.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge value={update.status} />
                      <p className="text-xs text-slate-400">{new Date(update.created_at).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-slate-600">{update.comment ?? "No comment."}</p>
                    {update.closure_photo_id ? <p className="mt-2 text-xs font-semibold text-safety-green">Closure photo attached</p> : null}
                  </div>
                )) : <p className="text-slate-500">No action updates yet.</p>}
              </div>
            </Card>
          </div>

          {/* Right: sticky decision panel */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <EhsAssignmentPanel
              reportNo={report.report_no}
              reportStatus={report.status}
              aiCategoryName={report.ai_category_name}
              aiUrgency={report.ai_urgency}
              finalUrgency={report.final_urgency}
              finalCategoryId={report.final_category_id}
              aiRecommendedImmediateAction={report.ai_recommended_immediate_action}
              aiSuggestedOwnerDepartment={report.ai_suggested_owner_department}
              actionOwners={actionOwners}
              categories={categories}
              existingAssignment={assignment}
            />

            {assignment ? (
              <EhsVerificationPanel
                reportNo={report.report_no}
                assignmentId={assignment.id}
                reportStatus={report.status}
                assignmentStatus={assignment.status}
              />
            ) : null}
          </div>
        </section>
      </div>
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
