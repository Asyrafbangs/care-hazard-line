import type { ReactNode } from "react";

/**
 * Calm, compact empty-state block for "no reports / no actions / nothing to do".
 */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
      {icon ? <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-100">{icon}</div> : null}
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
