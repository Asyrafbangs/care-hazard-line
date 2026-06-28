export type LanguageCode = "en" | "ms" | "ne" | "my" | "bn";
export type ReporterCategory = "employee" | "visitor";
export type UserRole = "admin" | "ehs" | "action_owner" | "hod" | "viewer";
export type ReportStatus =
  | "draft"
  | "submitted"
  | "ehs_review"
  | "assigned"
  | "in_progress"
  | "pending_verification"
  | "closed"
  | "reopened"
  | "cancelled";
export type UrgencyLevel = "low" | "medium" | "high" | "urgent";

export interface HazardSummary {
  hazardSummary: string;
  suggestedCategory: string;
  urgencyLevel: UrgencyLevel;
  recommendedImmediateAction: string;
  suggestedOwnerDepartment: string;
  aiStatus: "completed" | "fallback" | "failed";
}
