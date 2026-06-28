import { MobileShell } from "@/components/MobileShell";
import { ReportFlow } from "@/components/ReportFlow";

export default function NewReportPage() {
  return (
    <MobileShell title="New hazard report" subtitle="Type issue, attach photo, choose location, review AI, then submit.">
      <ReportFlow />
    </MobileShell>
  );
}
