"use client";

import { useMemo, useState } from "react";
import { Camera, CheckCircle2, HelpCircle, MapPin, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { locations } from "@/lib/dummy-data";
import type { HazardSummary, ReporterCategory } from "@/types/domain";

const initialSummary: HazardSummary | null = null;

export function ReportFlow() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<ReporterCategory>("employee");
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [location, setLocation] = useState(locations[0]?.name ?? "");
  const [summary, setSummary] = useState<HazardSummary | null>(initialSummary);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [submittedReportNo, setSubmittedReportNo] = useState("");

  const canContinueIdentity = name.trim().length > 1 && phone.trim().length > 5;
  const canGenerateAi = description.trim().length > 3 && photoName.trim().length > 0 && location.trim().length > 0;

  const progressLabel = useMemo(() => `Step ${step} of 5`, [step]);

  async function generateAiSummary() {
    setIsLoadingAi(true);
    const response = await fetch("/api/ai/hazard-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, location, photoUrl: photoName })
    });
    const result = (await response.json()) as HazardSummary;
    setSummary(result);
    setIsLoadingAi(false);
    setStep(4);
  }

  function submitReport() {
    const runningNo = Math.floor(Math.random() * 9000 + 1000);
    setSubmittedReportNo(`HZ-2026-${runningNo}`);
    setStep(5);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-safety-green">{progressLabel}</span>
          <button className="inline-flex items-center gap-1 text-slate-500"><HelpCircle size={16} /> Help</button>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-safety-green transition-all" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      {step === 1 ? (
        <Card>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-safety-green"><UserRound /></div>
          <h2 className="text-xl font-bold">Reporter details</h2>
          <p className="mt-1 text-sm text-slate-600">First-time user provides basic details. Returning users will be recognized by phone number later.</p>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">Name<input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
            <label className="block text-sm font-semibold">Phone number<input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Example: 60123456789" /></label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setCategory("employee")} className={`rounded-2xl border p-3 text-sm font-semibold ${category === "employee" ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200"}`}>Employee</button>
              <button onClick={() => setCategory("visitor")} className={`rounded-2xl border p-3 text-sm font-semibold ${category === "visitor" ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200"}`}>Visitor</button>
            </div>
            <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Privacy rule: EHS can see reporter details. Action owner cannot see reporter name or phone number.</p>
            <Button disabled={!canContinueIdentity} onClick={() => setStep(2)} className="w-full">Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-safety-green"><Camera /></div>
          <h2 className="text-xl font-bold">Describe and attach photo</h2>
          <p className="mt-1 text-sm text-slate-600">Keep it simple. Photo is mandatory.</p>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">Hazard description<textarea className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Example: Pallet blocking walkway near loading area" /></label>
            <label className="block text-sm font-semibold">Hazard photo<input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" type="file" accept="image/*" capture="environment" onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")} /></label>
            {photoName ? <p className="rounded-2xl bg-green-50 p-3 text-sm text-green-800">Photo selected: {photoName}</p> : <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Photo is required before AI review.</p>}
            <Button disabled={!description.trim() || !photoName} onClick={() => setStep(3)} className="w-full">Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-safety-green"><MapPin /></div>
          <h2 className="text-xl font-bold">Select location</h2>
          <p className="mt-1 text-sm text-slate-600">Choose from dummy locations. Real locations can be replaced in master data.</p>
          <div className="mt-5 space-y-3">
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={location} onChange={(event) => setLocation(event.target.value)}>
              {locations.map((item) => <option key={item.id} value={item.name}>{item.area} - {item.name}</option>)}
              <option value="Other">Other</option>
            </select>
            <Button disabled={!canGenerateAi || isLoadingAi} onClick={generateAiSummary} className="w-full gap-2"><Sparkles size={18} />{isLoadingAi ? "Processing..." : "Generate AI Summary"}</Button>
          </div>
        </Card>
      ) : null}

      {step === 4 && summary ? (
        <Card>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-safety-green"><Sparkles /></div>
          <h2 className="text-xl font-bold">Review AI summary</h2>
          <p className="mt-1 text-sm text-slate-600">Reporter must accept or correct this before submission.</p>
          <div className="mt-5 space-y-3 text-sm">
            <Info label="Hazard summary" value={summary.hazardSummary} />
            <Info label="Suggested category" value={summary.suggestedCategory} />
            <Info label="Urgency" value={summary.urgencyLevel} />
            <Info label="Immediate action" value={summary.recommendedImmediateAction} />
            <Info label="Suggested owner / department" value={summary.suggestedOwnerDepartment} />
            {summary.aiStatus !== "completed" ? <p className="rounded-2xl bg-amber-50 p-3 text-amber-800">AI status: {summary.aiStatus}. EHS will verify before final action.</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Correct</Button>
              <Button onClick={submitReport}>Accept & Submit</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 5 ? (
        <Card>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-safety-green"><CheckCircle2 /></div>
          <h2 className="text-xl font-bold">Report submitted</h2>
          <p className="mt-2 text-sm text-slate-600">Demo submission completed. In Phase 2 this will write to Supabase and upload the photo to Cloudinary.</p>
          <p className="mt-4 rounded-2xl bg-green-50 p-4 text-center text-xl font-bold text-safety-green">{submittedReportNo}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 w-full">Submit another report</Button>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}
