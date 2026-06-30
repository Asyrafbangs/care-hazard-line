import { GoogleGenAI } from "@google/genai";
import { getOptionalEnv } from "@/lib/env";

export type GeminiTurn = { role: "user" | "model"; text: string };

let client: GoogleGenAI | null = null;

/** Returns true when a Gemini API key is configured (AI conversation mode is available). */
export function isGeminiConfigured() {
  const explicitToggle = getOptionalEnv("WHATSAPP_AI_MODE");
  if (explicitToggle && ["0", "off", "false", "no"].includes(explicitToggle.toLowerCase())) {
    return false;
  }
  return Boolean(getOptionalEnv("GEMINI_API_KEY"));
}

export function getGeminiModel() {
  return getOptionalEnv("GEMINI_MODEL") || "gemini-2.5-flash";
}

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = getOptionalEnv("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Calls Gemini with a system instruction + conversation turns and forces a JSON
 * response matching `responseSchema`. Returns the parsed object, or null on any
 * failure so callers can fall back gracefully.
 */
export async function generateStructured<T>(input: {
  systemInstruction: string;
  contents: GeminiTurn[];
  // Gemini responseSchema (subset of OpenAPI schema). Typed loosely to avoid
  // coupling callers to the SDK's Schema type.
  responseSchema: Record<string, unknown>;
  temperature?: number;
}): Promise<T | null> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: input.contents.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }]
      })),
      config: {
        systemInstruction: input.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: input.responseSchema as never,
        temperature: input.temperature ?? 0.6
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[gemini] generateStructured failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
