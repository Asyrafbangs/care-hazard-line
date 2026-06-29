import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { ReporterTrackFlow } from "@/components/ReporterTrackFlow";

export const dynamic = "force-dynamic";

export default function ReporterTrackingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6">
      <header className="mb-6 rounded-3xl bg-safety-green p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-100">Reporter progress tracking</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Track my hazard report</h1>
            <p className="mt-2 max-w-2xl text-sm text-green-50">Check report progress using the phone number used during reporting. This is the web version of the future WhatsApp status check flow.</p>
          </div>
          <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-safety-green">Main menu</Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ReporterTrackFlow />
        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle size={20} /> WhatsApp-ready logic</h2>
            <p className="mt-2 text-sm text-slate-600">Later, WhatsApp will pass the reporter phone number automatically. The same API will return the report progress.</p>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} /> Privacy control</h2>
            <p className="mt-2 text-sm text-slate-600">Reporter tracking only searches reports linked to the phone number. It does not expose EHS internal notes or action owner identity.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
