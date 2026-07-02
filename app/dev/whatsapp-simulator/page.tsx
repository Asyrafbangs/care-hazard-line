import { MessageCircle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Card } from "@/components/Card";
import { WhatsAppSimulator } from "@/components/WhatsAppSimulator";
import { requireAppRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WhatsAppSimulatorPage() {
  await requireAppRole(["admin", "ehs"], "/dev/whatsapp-simulator");
  return (
    <MobileShell title="WhatsApp simulator" subtitle="Test the Phase 5 conversation engine without Meta setup.">
      <div className="space-y-4">
        <Card>
          <div className="flex gap-3">
            <MessageCircle className="mt-1 text-blue-800" size={22} />
            <div>
              <h2 className="text-lg font-bold">Local bot test</h2>
              <p className="mt-1 text-sm text-slate-600">
                This page calls the same conversation engine used by the WhatsApp webhook. It does not send real WhatsApp messages.
              </p>
            </div>
          </div>
        </Card>
        <WhatsAppSimulator />
      </div>
    </MobileShell>
  );
}
