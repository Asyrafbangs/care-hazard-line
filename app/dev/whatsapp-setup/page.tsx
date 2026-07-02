import { MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Card } from "@/components/Card";
import { WhatsAppProductionPanel } from "@/components/WhatsAppProductionPanel";
import { requireAppRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WhatsAppProductionPage() {
  await requireAppRole(["admin", "ehs"], "/dev/whatsapp-setup");
  return (
    <MobileShell title="WhatsApp production" subtitle="Connect Meta Cloud API to CARE Hazard Line.">
      <div className="space-y-4">
        <Card>
          <div className="flex gap-3">
            <MessageCircle className="mt-1 text-blue-800" size={22} />
            <div>
              <h2 className="text-lg font-bold">Phase 5B setup console</h2>
              <p className="mt-1 text-sm text-slate-600">
                Use this page after deploying to Vercel. Localhost cannot be used as the Meta webhook callback URL.
              </p>
            </div>
          </div>
        </Card>
        <WhatsAppProductionPanel />
      </div>
    </MobileShell>
  );
}
