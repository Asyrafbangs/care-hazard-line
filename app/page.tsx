"use client";

import Link from "next/link";
import { AlertTriangle, Camera, Search } from "lucide-react";
import { languages, t } from "@/lib/i18n";
import { useSavedLanguage } from "@/lib/use-language";

export default function HomePage() {
  const { language, setLanguage, firstVisit } = useSavedLanguage();
  const tr = (key: Parameters<typeof t>[1]) => t(language, key).text;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-safety-soft px-4 py-6 safe-area">
      {/* Branding */}
      <header className="rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-100">CARE Hazard Line</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{tr("tagline")}</h1>
      </header>

      {/* Main message */}
      <section className="mt-5 rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-slate-100">
        <h2 className="text-xl font-bold text-safety-ink">{tr("seeUnsafe")}</h2>
        <p className="mt-1 text-lg font-semibold text-safety-green">{tr("reportItHere")}</p>

        {/* Emergency warning — shown before the report button */}
        <div className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-4 text-left ring-1 ring-red-100">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
          <p className="text-sm font-medium text-red-800">{tr("emergencyNote")}</p>
        </div>

        {/* Primary + secondary CTAs */}
        <div className="mt-5 grid gap-3">
          <Link
            href="/reports/new"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-safety-green px-5 py-4 text-base font-bold text-white shadow-card transition active:scale-[0.99]"
          >
            <Camera size={20} /> {tr("reportSafetyIssue")}
          </Link>
          <Link
            href="/track"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-safety-green bg-white px-5 py-4 text-base font-bold text-safety-green transition active:scale-[0.99]"
          >
            <Search size={20} /> {tr("trackMyReport")}
          </Link>
        </div>

        {/* Examples */}
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{tr("homeExamples")}</p>
      </section>

      {/* Language selector */}
      <section className="mt-4 rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <p className={`text-sm font-semibold ${firstVisit ? "text-safety-green" : "text-safety-ink"}`}>
          {t(language, "chooseLanguage").text}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => setLanguage(item.code)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                item.code === language
                  ? "border-safety-green bg-green-50 text-safety-green"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {item.nativeLabel}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-6 text-center text-xs font-semibold text-slate-500">
        <div className="flex items-center justify-center gap-3">
          <Link href="/privacy" className="underline">{tr("privacyNotice")}</Link>
          <span aria-hidden>·</span>
          <Link href="/help" className="underline">{tr("helpLabel")}</Link>
          <span aria-hidden>·</span>
          <Link href="/login" className="underline">{tr("internalLogin")}</Link>
        </div>
      </footer>
    </main>
  );
}
