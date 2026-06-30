import type { LanguageCode, UrgencyLevel } from "@/types/domain";
import type { AiConversationContext, AiConversationPhase, AiConversationSlots } from "@/lib/whatsapp/types";
import { generateStructured, type GeminiTurn } from "@/lib/gemini";

const MAX_TRANSCRIPT_ENTRIES = 24; // ~12 exchanges

export interface AiHazardAnalysis {
  hazardSummary: string;
  suggestedCategory: string;
  urgencyLevel: UrgencyLevel;
  recommendedImmediateAction: string;
  suggestedOwnerDepartment: string;
}

export interface AiTurnResult {
  reply: string;
  detectedLanguage: LanguageCode | null;
  phase: AiConversationPhase;
  slots: AiConversationSlots;
  hazardAnalysis: AiHazardAnalysis | null;
  readyToSubmit: boolean;
}

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "The natural-language message to send to the reporter, in their language." },
    detectedLanguage: { type: "STRING", enum: ["en", "ms", "ne", "my", "bn"], nullable: true },
    phase: { type: "STRING", enum: ["setup", "reporting", "confirm"] },
    slots: {
      type: "OBJECT",
      nullable: true,
      properties: {
        name: { type: "STRING", nullable: true },
        category: { type: "STRING", enum: ["employee", "visitor"], nullable: true },
        employeeId: { type: "STRING", nullable: true },
        companyName: { type: "STRING", nullable: true },
        consent: { type: "BOOLEAN", nullable: true },
        description: { type: "STRING", nullable: true },
        locationText: { type: "STRING", nullable: true },
        urgency: { type: "STRING", enum: ["low", "medium", "high", "urgent"], nullable: true }
      }
    },
    hazardAnalysis: {
      type: "OBJECT",
      nullable: true,
      properties: {
        hazardSummary: { type: "STRING" },
        suggestedCategory: { type: "STRING" },
        urgencyLevel: { type: "STRING", enum: ["low", "medium", "high", "urgent"] },
        recommendedImmediateAction: { type: "STRING" },
        suggestedOwnerDepartment: { type: "STRING" }
      }
    },
    readyToSubmit: { type: "BOOLEAN" }
  },
  required: ["reply", "phase", "readyToSubmit"]
};

const HAZARD_CATEGORIES = [
  "Chemical Safety",
  "Machine Safety",
  "Electrical Safety",
  "Fire / Emergency",
  "Material Handling",
  "Housekeeping / Access",
  "Working at Height",
  "PPE / Unsafe Act",
  "Environmental",
  "Other"
];

function buildSystemInstruction(input: {
  isNewReporter: boolean;
  reporterName?: string | null;
  hasPhoto: boolean;
  knownSlots: AiConversationSlots;
  phase: AiConversationPhase;
}): string {
  const setupGoal = input.isNewReporter
    ? `This is a NEW reporter. Before taking a hazard report you must collect their profile:
   - full name
   - whether they are an "employee" or a "visitor"
   - if employee: their employee ID (they may say they don't have one / skip — that's fine, leave it null)
   - if visitor: their company name
   - explicit CONSENT: tell them briefly "Your name, phone, report details and photo are used for EHS hazard reporting and are visible to the EHS team only." Then get a clear yes before continuing. Only set slots.consent=true after they clearly agree.
   Keep phase="setup" until name + category + consent are all gathered, then move to phase="reporting".`
    : `This reporter already has a profile${input.reporterName ? ` (name: ${input.reporterName})` : ""}. Skip profile setup. Start in phase="reporting".`;

  return `You are the assistant for "CARE Hazard Line", a workplace safety hazard-reporting service that people talk to over WhatsApp. You sound like a calm, friendly, respectful human colleague — never robotic, never a numbered menu. Keep messages short and WhatsApp-sized. Ask for one thing at a time, but if the reporter volunteers several details at once, capture them all.

LANGUAGE: Detect the language the reporter is writing in and ALWAYS reply in that same language. Supported languages map to codes: English=en, Bahasa Melayu=ms, Nepali=ne, Myanmar/Burmese=my, Bangla/Bengali=bn. Put the detected code in detectedLanguage. If unclear, use en.

PROFILE SETUP:
${setupGoal}

HAZARD REPORT — collect ALL of these (phase="reporting"):
   - description: what the hazard is, in their words
   - locationText: where it is (area / building / machine etc.)
   - urgency: gauge how dangerous it is and classify as one of low | medium | high | urgent
   - a PHOTO of the hazard is MANDATORY. The system handles photos, not you. You must ask them to send a photo. You will be told in the status whether a photo has been received. NEVER set readyToSubmit=true until the status says a photo has been received.

CONFIRM & SUBMIT:
   When you have description + location + urgency AND a photo has been received, switch to phase="confirm": give a short natural summary (the hazard, the location, the urgency) and ask if you should submit it. Provide your structured hazardAnalysis in that same turn:
     - hazardSummary: one clear sentence
     - suggestedCategory: choose the best fit from this list exactly: ${HAZARD_CATEGORIES.join(", ")}
     - urgencyLevel: low | medium | high | urgent
     - recommendedImmediateAction: short practical action
     - suggestedOwnerDepartment: which team should own it
   Only when the reporter clearly confirms ("yes", "submit", "ok go ahead", etc.) set readyToSubmit=true. If they want changes, keep readyToSubmit=false and update the slots. Do NOT claim the report is submitted yourself — the system does that and will send the confirmation with the report ID.

SLOTS: In every response, return slots with every field you currently know (carry forward earlier values; only add/correct). Use null for anything still unknown.

CURRENT STATE (for your reasoning, do not read this aloud):
   phase: ${input.phase}
   photo_received: ${input.hasPhoto}
   known_slots: ${JSON.stringify(input.knownSlots)}

Respond ONLY with the JSON object defined by the schema.`;
}

function transcriptToContents(transcript: AiConversationContext["transcript"]): GeminiTurn[] {
  return transcript.map((entry) => ({
    role: entry.role === "user" ? "user" : "model",
    text: entry.text
  }));
}

function mergeSlots(prev: AiConversationSlots, next?: AiConversationSlots): AiConversationSlots {
  if (!next) return { ...prev };
  const merged: AiConversationSlots = { ...prev };
  for (const [key, value] of Object.entries(next)) {
    // Ignore null/undefined so the model can't wipe a value it already captured.
    if (value !== null && value !== undefined && value !== "") {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

/**
 * Runs one conversational turn through Gemini. Returns the parsed result plus the
 * updated conversation context (transcript + merged slots + phase), or null if
 * Gemini was unavailable so the caller can fall back.
 */
export async function runAiConversationTurn(input: {
  userText: string;
  hasPhoto: boolean;
  photoJustReceived: boolean;
  isNewReporter: boolean;
  reporterName?: string | null;
  aiContext: AiConversationContext;
}): Promise<{ result: AiTurnResult; aiContext: AiConversationContext } | null> {
  const { aiContext } = input;

  // The user-visible content for this turn. A photo arrival has no text, so we
  // hand the model a neutral note (it still won't see the binary).
  const userContent = input.photoJustReceived
    ? input.userText
      ? `${input.userText}\n[system note: the reporter just sent a photo of the hazard — it has been saved]`
      : "[system note: the reporter just sent a photo of the hazard — it has been saved]"
    : input.userText;

  const contents: GeminiTurn[] = [
    ...transcriptToContents(aiContext.transcript),
    { role: "user", text: userContent }
  ];

  const systemInstruction = buildSystemInstruction({
    isNewReporter: input.isNewReporter,
    reporterName: input.reporterName,
    hasPhoto: input.hasPhoto,
    knownSlots: aiContext.slots,
    phase: aiContext.phase
  });

  const raw = await generateStructured<AiTurnResult>({ systemInstruction, contents, responseSchema: RESPONSE_SCHEMA });
  if (!raw || !raw.reply) return null;

  const mergedSlots = mergeSlots(aiContext.slots, raw.slots);
  const phase: AiConversationPhase = raw.phase ?? aiContext.phase;

  const transcript = [
    ...aiContext.transcript,
    { role: "user" as const, text: userContent },
    { role: "bot" as const, text: raw.reply }
  ].slice(-MAX_TRANSCRIPT_ENTRIES);

  const result: AiTurnResult = {
    reply: raw.reply,
    detectedLanguage: raw.detectedLanguage ?? null,
    phase,
    slots: mergedSlots,
    hazardAnalysis: raw.hazardAnalysis ?? null,
    // Hard guard: never allow submission without a stored photo, whatever the model says.
    readyToSubmit: Boolean(raw.readyToSubmit) && input.hasPhoto
  };

  return { result, aiContext: { transcript, slots: mergedSlots, phase } };
}
