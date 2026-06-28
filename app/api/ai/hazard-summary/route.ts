import { NextResponse } from "next/server";
import { z } from "zod";
import { generateHazardSummary } from "@/lib/ai";

const schema = z.object({
  description: z.string().min(3),
  location: z.string().optional(),
  photoUrl: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Minimum fields are required before AI summary: description, photo, and location.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const summary = await generateHazardSummary(parsed.data);
  return NextResponse.json(summary);
}
