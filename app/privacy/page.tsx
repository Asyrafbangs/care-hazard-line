import type { Metadata } from "next";
import Link from "next/link";
import { Database, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { MobileShell } from "@/components/MobileShell";

export const metadata: Metadata = {
  title: "Privacy Policy | CARE Hazard Line",
  description: "Privacy policy for the CARE Hazard Line hazard reporting system."
};

export default function PrivacyPage() {
  return (
    <MobileShell title="Privacy Policy" subtitle="How CARE Hazard Line handles report information.">
      <div className="space-y-4">
        <Card>
          <p className="text-sm text-slate-700">
            CARE Hazard Line is used to report workplace hazards, track corrective actions, and notify EHS or assigned action owners.
            This policy explains what information may be collected and how it is used.
          </p>
          <p className="mt-3 text-xs text-slate-500">Last updated: June 30, 2026</p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Database size={18} /> Information We Collect
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Reporter contact details such as phone number, name, employee ID, visitor company, or WhatsApp profile name when provided.</li>
            <li>Hazard report details such as location, description, category, urgency, photos, timestamps, and report status.</li>
            <li>WhatsApp message content and delivery metadata needed to process reports and support audit records.</li>
            <li>EHS and action owner account details used for role-based access control.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <MessageCircle size={18} /> How We Use Information
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Receive and process hazard reports submitted through the web app or WhatsApp.</li>
            <li>Send report status updates, urgent alerts, clarification requests, and closure updates.</li>
            <li>Assign corrective actions to responsible owners and support EHS investigation workflows.</li>
            <li>Maintain safety, audit, and compliance records for workplace hazard management.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <LockKeyhole size={18} /> Sharing And Access
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            Reporter identity is visible to authorized EHS users for follow-up. Action owner views are designed to hide reporter
            name, phone number, employee ID, and visitor company unless EHS separately shares that information.
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Information is not sold. It may be processed by service providers used to operate the system, including Supabase, Vercel,
            GitHub, and Meta WhatsApp Cloud API.
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck size={18} /> Retention And Contact
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            Hazard reports and WhatsApp logs are retained as needed for safety follow-up, audit, and compliance. To request correction
            or deletion of personal information, contact your site EHS administrator or workplace management team.
          </p>
        </Card>

        <Link href="/" className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-safety-ink ring-1 ring-slate-200">
          Back to CARE Hazard Line
        </Link>
      </div>
    </MobileShell>
  );
}
