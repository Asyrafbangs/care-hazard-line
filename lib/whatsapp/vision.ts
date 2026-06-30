import { generateStructuredVision } from "@/lib/gemini";

export interface PhotoHazard {
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "urgent";
  recommendedAction: string;
}

export interface PhotoHazardAnalysis {
  hazardCount: number;
  hazards: PhotoHazard[];
  summary: string;
  hasClearHazard: boolean;
  aiStatus: "completed" | "failed";
}

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

const SCHEMA: Record<string, unknown> = {
  type: "OBJECT",
  properties: {
    hazardCount: { type: "INTEGER" },
    hasClearHazard: { type: "BOOLEAN" },
    summary: { type: "STRING", description: "Overall plain-language assessment. If no hazard, explain that none was obvious." },
    hazards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          category: { type: "STRING", enum: HAZARD_CATEGORIES },
          severity: { type: "STRING", enum: ["low", "medium", "high", "urgent"] },
          recommendedAction: { type: "STRING" }
        },
        required: ["title", "description", "category", "severity", "recommendedAction"]
      }
    }
  },
  required: ["hazardCount", "hasClearHazard", "summary", "hazards"]
};

const SYSTEM_INSTRUCTION = `You are an occupational EHS (Environment, Health & Safety) assessor. You are given a photo uploaded by an employee and their report description. Analyse the IMAGE together with the DESCRIPTION and identify any visible or reasonably inferred safety, health, environmental, or operational hazards.

- The number of hazards may be 0, 1, 2, 3 or more — report exactly what is visible or supported by the description.
- For each hazard provide: a short title, a clear description, a category (choose the closest from: ${HAZARD_CATEGORIES.join(", ")}), a severity (low | medium | high | urgent), and a recommended immediate action.
- If you find no clear hazard, return hazardCount 0, an empty hazards list, hasClearHazard false, and a summary explaining that no obvious hazard could be identified from the photo and description.

IMPORTANT: This assessment is only a decision-support tool. You must NEVER reject, dismiss, or imply that the report should be blocked. The employee is always allowed to submit the report for human review — even when 0 hazards are found or they disagree with your interpretation. The final decision and verification rest with the EHS / safety / management team. Keep the summary respectful and non-dismissive.`;

/**
 * Analyses an uploaded hazard photo together with the reporter's description.
 * Always returns a result (never throws); on failure returns a 0-hazard,
 * "failed" assessment so the reporter can still submit for human review.
 */
export async function analyzeHazardPhoto(input: {
  description?: string;
  imageBase64: string;
  mimeType: string;
}): Promise<PhotoHazardAnalysis> {
  const userText = input.description
    ? `Employee report description: "${input.description}". Assess the attached photo in this context.`
    : "No written description was provided. Assess the attached photo on its own.";

  const raw = await generateStructuredVision<PhotoHazardAnalysis>({
    systemInstruction: SYSTEM_INSTRUCTION,
    userText,
    imageBase64: input.imageBase64,
    mimeType: input.mimeType,
    responseSchema: SCHEMA
  });

  if (!raw) {
    return {
      hazardCount: 0,
      hazards: [],
      summary: "Automatic photo analysis was unavailable. The report can still be submitted for human EHS review.",
      hasClearHazard: false,
      aiStatus: "failed"
    };
  }

  const hazards = Array.isArray(raw.hazards) ? raw.hazards : [];
  return {
    hazardCount: typeof raw.hazardCount === "number" ? raw.hazardCount : hazards.length,
    hazards,
    summary: raw.summary ?? "",
    hasClearHazard: Boolean(raw.hasClearHazard),
    aiStatus: "completed"
  };
}
