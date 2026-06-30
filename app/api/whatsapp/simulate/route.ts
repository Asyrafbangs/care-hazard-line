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
  image: z.boolean().optional().default(false),
  // Optional real image (base64, no data: prefix) to exercise vision analysis.
  imageBase64: z.string().optional().nullable(),
  imageMimeType: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const payload = simulateSchema.parse(await request.json());
    const phoneNumber = normalizeWhatsAppPhone(payload.phoneNumber);
    const hasImage = payload.image || Boolean(payload.imageBase64);
    const inbound = {
      phoneNumber,
      whatsappId: `wa_${phoneNumber}`,
      profileName: payload.profileName ?? "Test Reporter",
      messageId: `sim_${Date.now()}`,
      type: hasImage ? "image" as const : "text" as const,
      text: payload.text ?? "",
      mediaId: hasImage ? `simulated_media_${Date.now()}` : undefined,
      mediaMimeType: hasImage ? payload.imageMimeType ?? "image/jpeg" : undefined,
      caption: hasImage ? payload.text ?? "" : undefined,
      imageBase64: payload.imageBase64 ?? undefined,
      rawPayload: { ...payload, imageBase64: payload.imageBase64 ? "[base64]" : undefined },
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
