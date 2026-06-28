import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 ${className}`}>{children}</section>;
}
