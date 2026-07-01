import { Check } from "lucide-react";

/**
 * Horizontal step indicator for guided flows. `current` is 1-based.
 */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                aria-current={isActive ? "step" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${
                  isActive
                    ? "bg-blue-800 text-white ring-blue-800"
                    : isDone
                      ? "bg-blue-100 text-blue-800 ring-blue-200"
                      : "bg-white text-slate-400 ring-slate-200"
                }`}
              >
                {isDone ? <Check size={16} /> : stepNumber}
              </span>
              <span className={`hidden text-sm font-semibold sm:inline ${isActive ? "text-blue-900" : "text-slate-500"}`}>{label}</span>
            </div>
            {stepNumber < steps.length ? (
              <span className={`mx-2 h-0.5 flex-1 rounded-full ${isDone ? "bg-blue-300" : "bg-slate-200"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
