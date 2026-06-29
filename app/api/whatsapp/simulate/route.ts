import { NextResponse } from "next/server";
import { z } from "zod";
import { processWhatsAppInbound } from "@/lib/whatsapp/engine";
import { logWhatsAppMessage } from "@/lib/whatsapp/send";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/messages";

export const runtime = "nodejs";

const simulateSchema = z.object({
  phoneNumber: z.string().trim().min(6),
  profileName: z.string().trim().optional().nullable(),
  text: z.string().trim().optional().nullable(),
  image: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  try {
    const payload = simulateSchema.parse(await request.json());
    const phoneNumber = normalizeWhatsAppPhone(payload.phoneNumber);
    const inbound = {
      phoneNumber,
      whatsappId: `wa_${phoneNumber}`,
      profileName: payload.profileName ?? "Test Reporter",
      messageId: `sim_${Date.now()}`,
      type: payload.image ? "image" as const : "text" as const,
      text: payload.text ?? "",
      mediaId: payload.image ? `simulated_media_${Date.now()}` : undefined,
      mediaMimeType: payload.image ? "image/jpeg" : undefined,
      caption: payload.image ? payload.text ?? "" : undefined,
      rawPayload: payload,
      source: "simulator" as const
    };

    await logWhatsAppMessage({
      phoneNumber,
      direction: "inbound",
      messageType: inbound.type,
      messageText: inbound.text,
      payload,
      status: "received"
    });

    const result = await processWhatsAppInbound(inbound);

    await logWhatsAppMessage({
      phoneNumber,
      direction: "outbound",
      messageType: "simulator_reply",
      messageText: result.reply,
      payload: result,
      status: "sent"
    });

    return NextResponse.json({ ok: true, reply: result.reply, state: result.state, reportNo: result.reportNo ?? null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid simulator payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown WhatsApp simulator error" },
      { status: 500 }
    );
  }
}
