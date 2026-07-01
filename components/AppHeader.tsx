"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { languages } from "@/lib/i18n";
import type { LanguageCode } from "@/types/domain";

/**
 * TAMCO-style header for public and guided task pages: logo, title, short
 * description, optional (controlled) language selector, tutorial link, and a
 * slot for extra actions. Blue top accent matches the design direction.
 */
export function AppHeader({
  title,
  description,
  language,
  onLanguageChange,
  tutorialHref,
  actions
}: {
  title: string;
  description?: string;
  language?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
  tutorialHref?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="h-1.5 w-full bg-blue-800" />
      <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-800 px-2.5 py-1 text-sm font-black tracking-tight text-white">TAMCO</span>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {language && onLanguageChange ? (
            <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onLanguageChange(item.code)}
                  aria-pressed={item.code === language}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    item.code === language ? "border-blue-800 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {item.nativeLabel}
                </button>
              ))}
            </div>
          ) : null}
          {tutorialHref || actions ? (
            <div className="flex flex-wrap gap-2">
              {tutorialHref ? (
                <Link
                  href={tutorialHref}
                  className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                >
                  <HelpCircle size={16} /> Tutorial
                </Link>
              ) : null}
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
