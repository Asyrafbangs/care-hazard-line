import type { ReactNode } from "react";

export function MobileShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-safety-soft px-4 py-5 safe-area">
      <header className="mb-5 rounded-3xl bg-safety-green p-5 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">CARE Hazard Line</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-green-50">{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}
