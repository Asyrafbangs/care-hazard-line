import Link from "next/link";
import { Camera } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ReporterTrackFlow } from "@/components/ReporterTrackFlow";

export const dynamic = "force-dynamic";

export default function ReporterTrackingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-safety-soft px-4 py-6 safe-area">
      <div className="space-y-4">
        <AppHeader
          title="Track My Report"
          description="Check the status of a hazard you reported."
          tutorialHref="/help"
          actions={
            <Link href="/reports/new" className="inline-flex items-center gap-1 rounded-2xl bg-blue-800 px-3 py-2 text-sm font-semibold text-white">
              <Camera size={16} /> Report a hazard
            </Link>
          }
        />
        <ReporterTrackFlow />
      </div>
    </main>
  );
}
