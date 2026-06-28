import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  // Phase 1 only logs the shape. Phase 5 will parse messages, media, language and status replies.
  return NextResponse.json({
    received: true,
    phase: "Phase 1 placeholder",
    nextStep: "Parse WhatsApp message entries and map sender phone to reporter profile.",
    hasPayload: Boolean(payload)
  });
}
