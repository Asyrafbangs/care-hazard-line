import type { LanguageCode, ReporterCategory, UrgencyLevel } from "@/types/domain";

export type WhatsAppSessionState =
  | "await_language"
  | "await_name"
  | "await_category"
  | "await_employee_id"
  | "await_company_name"
  | "await_consent"
  | "main_menu"
  | "await_description"
  | "await_photo"
  | "await_location"
  | "await_urgency"
  | "await_ai_confirmation"
  | "await_status_report";

export type WhatsAppInboundType = "text" | "image" | "interactive" | "unsupported";

export interface WhatsAppInboundMessage {
  phoneNumber: string;
  whatsappId: string;
  profileName?: string;
  messageId?: string;
  type: WhatsAppInboundType;
  text?: string;
  mediaId?: string;
  mediaMimeType?: string;
  caption?: string;
  rawPayload?: unknown;
  source?: "webhook" | "simulator";
}

export interface WhatsAppStoredPhoto {
  provider: "supabase" | "legacy";
  bucket?: string | null;
  path?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  mediaId?: string | null;
}

export interface WhatsAppReportDraft {
  description?: string;
  photo?: WhatsAppStoredPhoto;
  locationText?: string;
  workerUrgency?: UrgencyLevel;
  aiSummary?: {
    hazardSummary: string;
    suggestedCategory: string;
    urgencyLevel: UrgencyLevel;
    recommendedImmediateAction: string;
    suggestedOwnerDepartment: string;
    aiStatus: "completed" | "fallback" | "failed";
  };
}

export interface WhatsAppSessionContext {
  name?: string;
  category?: ReporterCategory;
  employeeId?: string | null;
  companyName?: string | null;
  draft?: WhatsAppReportDraft;
}

export interface WhatsAppSessionRow {
  id: string;
  phone_number: string;
  reporter_id: string | null;
  state: WhatsAppSessionState;
  selected_language: LanguageCode;
  context: WhatsAppSessionContext;
}

export interface WhatsAppEngineResult {
  ok: boolean;
  reply: string;
  state: WhatsAppSessionState;
  reportNo?: string;
  shouldSend?: boolean;
}
