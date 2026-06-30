"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Camera, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import { useSavedLanguage } from "@/lib/use-language";

export default function HelpPage() {
  const { language } = useSavedLanguage();
  const tr = (key: Parameters<typeof t>[1]) => t(language, key).text;

  const steps = [
    tr("describeHazard"),
    tr("photoRequired"),
    tr("chooseLocation"),
    tr("reviewAi"),
    tr("submitReport")
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-safety-soft px-4 py-6 safe-area">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-safety-green">
        <ArrowLeft size={16} /> CARE Hazard Line
      </Link>

      <header className="rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-100">{tr("getHelp")}</p>
        <h1 className="mt-2 text-2xl font-bold">{tr("reportHazard")}</h1>
      </header>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-safety-green">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm text-slate-700">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
          <p className="text-sm font-medium text-red-800">{tr("emergencyNote")}</p>
        </div>
      </section>

      <div className="mt-4 grid gap-3">
        <Link
          href="/reports/new"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-safety-green px-5 py-4 text-base font-bold text-white shadow-card"
        >
          <Camera size={20} /> {tr("reportSafetyIssue")}
        </Link>
        <Link
          href="/track"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-safety-green bg-white px-5 py-4 text-base font-bold text-safety-green"
        >
          <Search size={20} /> {tr("trackMyReport")}
        </Link>
      </div>

      <footer className="mt-auto pt-6 text-center text-xs font-semibold text-slate-500">
        <Link href="/privacy" className="underline">{tr("privacyNotice")}</Link>
      </footer>
    </main>
  );
}
