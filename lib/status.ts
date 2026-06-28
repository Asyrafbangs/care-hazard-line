import type { ReportStatus } from "@/types/domain";

export const statusFlow: Array<{ value: ReportStatus; label: string; purpose: string }> = [
  { value: "draft", label: "Draft", purpose: "Reporter has started but not submitted." },
  { value: "submitted", label: "Submitted", purpose: "Report received after AI summary confirmation." },
  { value: "ehs_review", label: "EHS Review", purpose: "EHS checks AI suggestion and confirms risk." },
  { value: "assigned", label: "Assigned", purpose: "Action owner and due date assigned." },
  { value: "in_progress", label: "In Progress", purpose: "Owner is working on the action." },
  { value: "pending_verification", label: "Pending Verification", purpose: "Owner claims completed; EHS verification needed." },
  { value: "closed", label: "Closed", purpose: "EHS verified and closed." },
  { value: "reopened", label: "Reopened", purpose: "Closure was not sufficient or issue repeated." },
  { value: "cancelled", label: "Cancelled", purpose: "Duplicate, invalid, or not a hazard report." }
];

export function statusLabel(status: ReportStatus) {
  return statusFlow.find((item) => item.value === status)?.label ?? status;
}
