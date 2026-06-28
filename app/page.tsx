import Link from "next/link";
import { Camera, Languages, ShieldCheck, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function HomePage() {
  return (
    <MobileShell title="Report hazard fast" subtitle="WhatsApp-style reporting flow for employees and visitors.">
      <div className="space-y-4">
        <Card>
          <LanguageSelector />
        </Card>

        <div className="grid gap-3">
          <Link href="/reports/new">
            <Button className="w-full gap-2">
              <Camera size={18} /> Report Hazard
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary" className="w-full gap-2">
              <ShieldCheck size={18} /> EHS / Action Owner Login
            </Button>
          </Link>
        </div>

        <Card>
          <h2 className="text-lg font-bold">Phase 1 foundation</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p className="flex gap-3"><Sparkles className="mt-0.5 shrink-0 text-safety-green" size={18} /> AI summary structure is ready with safe fallback.</p>
            <p className="flex gap-3"><Languages className="mt-0.5 shrink-0 text-safety-green" size={18} /> Language is stored at reporter level in the database design.</p>
            <p className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-safety-green" size={18} /> Action owner view is designed to hide reporter name and phone number.</p>
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
