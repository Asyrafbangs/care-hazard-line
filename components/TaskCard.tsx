import type { ReactNode } from "react";

/**
 * Primary form card for the current guided step: numbered badge, title, helper
 * text, form content, and an optional footer action row.
 */
export function TaskCard({
  stepNumber,
  eyebrow,
  title,
  helper,
  children,
  footer
}: {
  stepNumber?: number;
  eyebrow?: string;
  title: string;
  helper?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          {typeof stepNumber === "number" ? (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
              {stepNumber}
            </span>
          ) : null}
          <div>
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p> : null}
            <h2 className="text-xl font-bold text-safety-ink">{title}</h2>
            {helper ? <p className="mt-1 text-sm text-slate-600">{helper}</p> : null}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
      {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/60 p-4">{footer}</div> : null}
    </section>
  );
}
