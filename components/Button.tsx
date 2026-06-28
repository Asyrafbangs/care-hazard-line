import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-safety-green text-white shadow-sm hover:bg-green-700",
  secondary: "bg-white text-safety-ink ring-1 ring-slate-200 hover:bg-slate-50",
  danger: "bg-safety-red text-white hover:bg-red-700",
  ghost: "bg-transparent text-safety-ink hover:bg-white/60"
};

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
