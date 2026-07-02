import type { ReactNode } from "react";

/**
 * Clean header for internal (EHS / action owner / admin) pages: TAMCO mark,
 * eyebrow, title, subtitle, and a right-side slot for badges/actions.
 * Dashboard-style pages share this look; guided public flows use AppHeader.
 */
export function ConsoleHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="h-1.5 w-full bg-blue-800" />
      <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-800 px-2.5 py-1 text-sm font-black tracking-tight text-white">TAMCO</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
            <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
