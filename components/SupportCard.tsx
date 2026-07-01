import type { ReactNode } from "react";

/**
 * Contextual side card (draft status, checklist, guidance). On mobile it should
 * be placed after the main TaskCard.
 */
export function SupportCard({ title, icon, children }: { title?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <aside className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100">
      {title ? (
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          {icon}
          {title}
        </h3>
      ) : null}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </aside>
  );
}
