"use client";

import { useState } from "react";
import { languages, t } from "@/lib/i18n";
import type { LanguageCode } from "@/types/domain";

export function LanguageSelector() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const title = t(language, "chooseLanguage");
  const welcome = t(language, "welcome");

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-safety-ink">{title.text}</p>
      <div className="grid gap-2">
        {languages.map((item) => (
          <button
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              item.code === language ? "border-safety-green bg-green-50 text-safety-green" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span className="font-semibold">{item.nativeLabel}</span>
            <span className="ml-2 text-xs text-slate-500">{item.label}</span>
          </button>
        ))}
      </div>
      <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{welcome.text}</p>
    </div>
  );
}
