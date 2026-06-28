import type { HazardSummary } from "@/types/domain";
import { hazardCategories } from "@/lib/dummy-data";

function inferCategory(description: string) {
  const lower = description.toLowerCase();

  if (/spill|oil|leak|chemical|label|sds/.test(lower)) return "Chemical Safety";
  if (/guard|machine|moving|interlock/.test(lower)) return "Machine Safety";
  if (/plug|cable|wire|electrical|panel/.test(lower)) return "Electrical Safety";
  if (/exit|fire|extinguisher|alarm|evacuation/.test(lower)) return "Fire / Emergency";
  if (/stack|pallet|lifting|forklift|material/.test(lower)) return "Material Handling";
  if (/walkway|blocked|housekeeping|floor|trip/.test(lower)) return "Housekeeping / Access";
  if (/ladder|height|roof|scaffold/.test(lower)) return "Working at Height";
  if (/ppe|helmet|glove|shoe|goggle/.test(lower)) return "PPE / Unsafe Act";
  if (/waste|drain|emission|environment/.test(lower)) return "Environmental";

  return "Other";
}

function inferUrgency(category: string, description: string): HazardSummary["urgencyLevel"] {
  const lower = description.toLowerCase();

  if (/urgent|fire|smoke|shock|leak|collapse|immediate|serious/.test(lower)) return "urgent";
  const categoryDefault = hazardCategories.find((item) => item.name === category)?.defaultUrgency;
  return (categoryDefault as HazardSummary["urgencyLevel"]) ?? "medium";
}

function suggestOwner(category: string) {
  if (["Machine Safety", "Electrical Safety"].includes(category)) return "Maintenance";
  if (category === "Housekeeping / Access") return "Area owner / Supervisor";
  if (category === "Chemical Safety") return "Area owner + EHS";
  if (category === "Fire / Emergency") return "Facilities + EHS";
  if (category === "Material Handling") return "Warehouse / Logistics";
  if (category === "Environmental") return "EHS";
  return "EHS review required";
}

export async function generateHazardSummary(input: {
  description: string;
  location?: string;
  photoUrl?: string;
}): Promise<HazardSummary> {
  // Phase 1 uses deterministic fallback logic so the reporting flow is testable without an AI key.
  // Phase 2 can replace this with a vision-capable AI call while keeping the same return shape.
  try {
    const category = inferCategory(input.description);
    const urgency = inferUrgency(category, input.description);

    return {
      hazardSummary: input.location
        ? `${input.description.trim()} at ${input.location}.`
        : input.description.trim(),
      suggestedCategory: category,
      urgencyLevel: urgency,
      recommendedImmediateAction:
        urgency === "urgent"
          ? "Move away from the hazard area and alert EHS or supervisor immediately."
          : "Control the area if safe and assign owner for corrective action.",
      suggestedOwnerDepartment: suggestOwner(category),
      aiStatus: process.env.OPENAI_API_KEY ? "completed" : "fallback"
    };
  } catch {
    return {
      hazardSummary: input.description.trim(),
      suggestedCategory: "Other",
      urgencyLevel: "medium",
      recommendedImmediateAction: "EHS to review and decide required action.",
      suggestedOwnerDepartment: "EHS review required",
      aiStatus: "failed"
    };
  }
}
