"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Search, Sparkles, TriangleAlert } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Stepper } from "@/components/Stepper";
import { TaskCard } from "@/components/TaskCard";
import { SupportCard } from "@/components/SupportCard";
import { PhotoUploadCard } from "@/components/PhotoUploadCard";
import { Button } from "@/components/Button";
import { locations, hazardCategories } from "@/lib/dummy-data";
import { useSavedLanguage } from "@/lib/use-language";
import type { HazardSummary, ReporterCategory, UrgencyLevel } from "@/types/domain";

const STEPS = ["Describe", "Confirm", "Submit"];
const DRAFT_KEY = "care-hazard-draft";

type UploadedPhoto = {
  provider: "supabase";
  bucket: string;
  path: string;
  signedUrl?: string | null;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
};

export function ReportFlow() {
  const { language, setLanguage } = useSavedLanguage();
  const [step, setStep] = useState(1);

  // Step 1 — describe
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(locations[0]?.name ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoError, setShowPhotoError] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Step 2 — confirm (editable suggestion)
  const [summary, setSummary] = useState<HazardSummary | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Step 3 — reporter
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<ReporterCategory>("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [privacyAck, setPrivacyAck] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedReportNo, setSubmittedReportNo] = useState("");

  // Restore a saved draft (text only) on first load.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { description?: string; location?: string };
        if (draft.description) setDescription(draft.description);
        if (draft.location) setLocation(draft.location);
      }
    } catch {
      // ignore
    }
  }, []);

  const missing = {
    description: description.trim().length < 4,
    photo: !photoFile,
    location: location.trim().length === 0
  };
  const canContinueStep1 = !missing.description && !missing.photo && !missing.location;
  const canSubmit = name.trim().length > 1 && phone.trim().length > 5 && privacyAck;

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ description, location }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch {
      // ignore
    }
  }

  async function goToConfirm() {
    if (!canContinueStep1) {
      setShowPhotoError(missing.photo);
      return;
    }
    setStep(2);
    if (!summary) await generateSuggestion();
  }

  async function generateSuggestion() {
    setIsLoadingAi(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/ai/hazard-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, location, photoUrl: photoFile?.name ?? "photo-selected" })
      });
      const result = (await response.json()) as HazardSummary;
      setSummary(result);
    } catch {
      setSummary({
        hazardSummary: description,
        suggestedCategory: "Other",
        urgencyLevel: "medium",
        recommendedImmediateAction: "EHS to review and advise immediate control.",
        suggestedOwnerDepartment: "EHS review required",
        aiStatus: "failed"
      });
    } finally {
      setIsLoadingAi(false);
    }
  }

  function updateSummary(patch: Partial<HazardSummary>) {
    setSummary((current) => (current ? { ...current, ...patch } : current));
  }

  async function uploadHazardPhoto(file: File): Promise<UploadedPhoto> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/storage/hazard-photo", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok || !result.ok || !result.bucket || !result.path || !result.originalFileName || !result.mimeType || !result.sizeBytes) {
      throw new Error(result.error ?? "Photo upload issue detected. Try again or contact EHS.");
    }
    return {
      provider: "supabase",
      bucket: result.bucket,
      path: result.path,
      signedUrl: result.signedUrl ?? null,
      originalFileName: result.originalFileName,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes
    };
  }

  async function submitReport() {
    if (!summary || !photoFile) {
      setSubmitError("Please add a hazard photo before submitting.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const uploadedPhoto = await uploadHazardPhoto(photoFile);
      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter: {
            name,
            phoneNumber: phone,
            category,
            employeeId: employeeId || null,
            companyName: companyName || null,
            preferredLanguage: language,
            identityVisibility: "ehs_only"
          },
          report: {
            description,
            locationName: location,
            locationText: location,
            photo: uploadedPhoto,
            aiSummary: summary,
            reporterConfirmedAiSummary: true
          }
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.reportNo) {
        throw new Error(result.error ?? "Report could not be submitted. Please try again.");
      }
      window.localStorage.removeItem(DRAFT_KEY);
      setSubmittedReportNo(result.reportNo);
      setStep(4);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Report could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success screen
  if (step === 4) {
    return (
      <div className="space-y-4">
        <AppHeader title="Report Safety Issue" description="Thank you for helping keep the workplace safe." />
        <TaskCard title="Report submitted" helper="Your report and photo were sent to the EHS team for review.">
          <div className="flex flex-col items-center py-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-safety-green">
              <CheckCircle2 size={30} />
            </div>
            <p className="mt-4 text-sm text-slate-600">Your report ID</p>
            <p className="mt-1 rounded-2xl bg-green-50 px-6 py-3 text-2xl font-bold text-safety-green">{submittedReportNo}</p>
            <p className="mt-3 max-w-sm text-sm text-slate-500">Keep this ID to track your report status anytime.</p>
            <div className="mt-6 grid w-full gap-3 sm:max-w-sm">
              <Link href="/track" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-safety-green px-5 py-3 text-base font-bold text-white">
                <Search size={18} /> Track My Report
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-5 py-3 text-base font-bold text-slate-700"
              >
                Submit another report
              </button>
            </div>
          </div>
        </TaskCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AppHeader
        title="Report Safety Issue"
        description="Describe the hazard, add a photo, confirm, and submit."
        language={language}
        onLanguageChange={setLanguage}
        tutorialHref="/help"
        actions={
          <Link href="/track" className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
            <Search size={16} /> Track report
          </Link>
        }
      />

      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="order-1">
          {step === 1 ? (
            <TaskCard
              stepNumber={1}
              eyebrow="Step 1"
              title="Describe hazard"
              helper="Use simple words. EHS will review and assign action."
              footer={
                <>
                  <Button variant="secondary" onClick={saveDraft}>{draftSaved ? "Draft saved" : "Save draft"}</Button>
                  <Button onClick={goToConfirm} disabled={!canContinueStep1}>Continue</Button>
                </>
              }
            >
              <div className="space-y-4">
                <label className="block text-sm font-semibold">
                  What happened? <span className="text-safety-red">*</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                    placeholder="Example: Pallet blocking fire extinguisher"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Location <span className="text-safety-red">*</span>
                  <select
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-safety-green"
                  >
                    {locations.map((item) => (
                      <option key={item.id} value={item.name}>{item.area} - {item.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </label>
                <PhotoUploadCard
                  file={photoFile}
                  onChange={(file) => {
                    setPhotoFile(file);
                    setShowPhotoError(false);
                  }}
                  required
                  error={showPhotoError ? "A photo is required. Take one from a safe position." : undefined}
                />
              </div>
            </TaskCard>
          ) : null}

          {step === 2 ? (
            <TaskCard
              stepNumber={2}
              eyebrow="Step 2"
              title="Confirm summary"
              helper="We prepared a suggested summary. Check it and edit anything that is not right."
              footer={
                <>
                  <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} disabled={isLoadingAi || !summary}>Looks correct</Button>
                </>
              }
            >
              {isLoadingAi || !summary ? (
                <div className="flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                  <Sparkles size={18} /> Preparing suggested summary...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">
                    <Sparkles size={16} /> Suggested summary ready — you can edit it below.
                  </div>
                  <label className="block text-sm font-semibold">
                    Hazard summary
                    <textarea
                      value={summary.hazardSummary}
                      onChange={(event) => updateSummary({ hazardSummary: event.target.value })}
                      className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Category
                      <select
                        value={summary.suggestedCategory}
                        onChange={(event) => updateSummary({ suggestedCategory: event.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-safety-green"
                      >
                        {hazardCategories.map((item) => (
                          <option key={item.name} value={item.name}>{item.name}</option>
                        ))}
                        {hazardCategories.every((item) => item.name !== summary.suggestedCategory) ? (
                          <option value={summary.suggestedCategory}>{summary.suggestedCategory}</option>
                        ) : null}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      How urgent?
                      <select
                        value={summary.urgencyLevel}
                        onChange={(event) => updateSummary({ urgencyLevel: event.target.value as UrgencyLevel })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-safety-green"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm font-semibold">
                    Suggested immediate action
                    <textarea
                      value={summary.recommendedImmediateAction}
                      onChange={(event) => updateSummary({ recommendedImmediateAction: event.target.value })}
                      className="mt-1 min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green"
                    />
                  </label>
                  <p className="text-xs text-slate-500">This is a suggestion to help EHS. The EHS team makes the final decision.</p>
                </div>
              )}
            </TaskCard>
          ) : null}

          {step === 3 ? (
            <TaskCard
              stepNumber={3}
              eyebrow="Step 3"
              title="Your details"
              helper="We only ask this at the end. EHS can see your details; action owners cannot."
              footer={
                <>
                  <Button variant="secondary" onClick={() => setStep(2)} disabled={isSubmitting}>Back</Button>
                  <Button onClick={submitReport} disabled={!canSubmit || isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Report"}</Button>
                </>
              }
            >
              <div className="space-y-4">
                <label className="block text-sm font-semibold">
                  Name <span className="text-safety-red">*</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="Your name" />
                </label>
                <label className="block text-sm font-semibold">
                  Phone number <span className="text-safety-red">*</span>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="Example: 60123456789" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCategory("employee")} className={`min-h-11 rounded-2xl border p-3 text-sm font-semibold ${category === "employee" ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 text-slate-600"}`}>Employee</button>
                  <button type="button" onClick={() => setCategory("visitor")} className={`min-h-11 rounded-2xl border p-3 text-sm font-semibold ${category === "visitor" ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 text-slate-600"}`}>Visitor</button>
                </div>
                {category === "employee" ? (
                  <label className="block text-sm font-semibold">
                    Employee ID <span className="text-xs font-normal text-slate-400">optional</span>
                    <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="Example: EMP001" />
                  </label>
                ) : (
                  <label className="block text-sm font-semibold">
                    Company name <span className="text-xs font-normal text-slate-400">optional</span>
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-safety-green" placeholder="Example: ABC Engineering" />
                  </label>
                )}
                <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  <input type="checkbox" checked={privacyAck} onChange={(event) => setPrivacyAck(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-safety-green" />
                  <span>I understand my name, phone, report details and photo are used for EHS hazard reporting and are visible to the EHS team only.</span>
                </label>
                {submitError ? (
                  <p className="flex items-center gap-1 rounded-2xl bg-red-50 p-3 text-sm text-red-700"><AlertTriangle size={15} /> {submitError}</p>
                ) : null}
              </div>
            </TaskCard>
          ) : null}
        </div>

        {/* Support card */}
        <div className="order-2">
          <SupportCard title="Progress" icon={<ClipboardList size={15} />}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {step === 4 ? "Submitted" : "Not submitted yet"}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Need now</p>
            <ul className="mt-2 space-y-2 text-sm">
              <ChecklistItem done={!missing.description} label="Hazard description" />
              <ChecklistItem done={!missing.photo} label="Photo evidence" />
              <ChecklistItem done={!missing.location} label="Location" />
            </ul>

            <div className="mt-4 flex gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-800 ring-1 ring-red-100">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>Immediate danger? Move away and inform Supervisor / EHS / Security first. Report after you are safe.</span>
            </div>
          </SupportCard>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${done ? "bg-safety-green" : "bg-slate-200"}`}>
        {done ? <CheckCircle2 size={14} /> : null}
      </span>
      <span className={done ? "text-slate-700" : "text-slate-500"}>{label}</span>
    </li>
  );
}
