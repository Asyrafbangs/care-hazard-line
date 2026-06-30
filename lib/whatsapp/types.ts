import type { LanguageCode, ReporterCategory, UrgencyLevel } from "@/types/domain";
import type { PhotoHazardAnalysis } from "@/lib/whatsapp/vision";

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
  | "await_status_report"
  | "ai_chat";

export type AiConversationPhase = "setup" | "reporting" | "confirm";

export interface AiConversationSlots {
  name?: string;
  category?: ReporterCategory;
  employeeId?: string | null;
  companyName?: string | null;
  consent?: boolean;
  description?: string;
  locationText?: string;
  urgency?: UrgencyLevel;
}

export interface AiConversationContext {
  transcript: Array<{ role: "user" | "bot"; text: string }>;
  slots: AiConversationSlots;
  phase: AiConversationPhase;
}

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
  // Simulator-only: a real base64 image so the vision path can be tested.
  imageBase64?: string;
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
  photoAnalysis?: PhotoHazardAnalysis;
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
  aiChat?: AiConversationContext;
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
