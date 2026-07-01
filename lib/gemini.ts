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

// Gemini occasionally returns transient 503 "model overloaded" / 429 rate-limit
// errors, especially at peak. These are safe to retry after a short wait.
function isTransientError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("high demand") ||
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit")
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1 && isTransientError(error)) {
        // Exponential backoff with jitter: ~0.5s, ~1.1s.
        const delay = 500 * (attempt + 1) + Math.floor(Math.random() * 250);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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
    const response = await withRetry(() =>
      ai.models.generateContent({
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
      })
    );

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

/**
 * Vision variant: sends an inline image plus text and forces a JSON response
 * matching `responseSchema`. Returns the parsed object, or null on any failure.
 */
export async function generateStructuredVision<T>(input: {
  systemInstruction: string;
  userText: string;
  imageBase64: string;
  mimeType: string;
  responseSchema: Record<string, unknown>;
  temperature?: number;
}): Promise<T | null> {
  try {
    const ai = getClient();
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: getGeminiModel(),
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
              { text: input.userText }
            ]
          }
        ],
        config: {
          systemInstruction: input.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: input.responseSchema as never,
          temperature: input.temperature ?? 0.4
        }
      })
    );

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[gemini] generateStructuredVision failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
