import { NextResponse } from "next/server";
import { processWhatsAppInbound } from "@/lib/whatsapp/engine";
import { logWhatsAppMessage, sendWhatsAppText } from "@/lib/whatsapp/send";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/messages";
import type { WhatsAppInboundMessage } from "@/lib/whatsapp/types";

export const runtime = "nodejs";

type WhatsAppWebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string; description?: string };
  };
};

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: WhatsAppWebhookMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
};

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

function extractText(message: WhatsAppWebhookMessage) {
  if (message.type === "text") return message.text?.body ?? "";
  if (message.type === "interactive") {
    return message.interactive?.button_reply?.id
      ?? message.interactive?.button_reply?.title
      ?? message.interactive?.list_reply?.id
      ?? message.interactive?.list_reply?.title
      ?? "";
  }
  if (message.type === "image") return message.image?.caption ?? "";
  return "";
}

function toInboundMessages(payload: WhatsAppWebhookPayload): WhatsAppInboundMessage[] {
  const output: WhatsAppInboundMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const contact = value?.contacts?.[0];

      for (const message of value?.messages ?? []) {
        const from = normalizeWhatsAppPhone(message.from ?? contact?.wa_id ?? "");
        if (!from) continue;

        output.push({
          phoneNumber: from,
          whatsappId: contact?.wa_id ? `wa_${contact.wa_id}` : `wa_${from}`,
          profileName: contact?.profile?.name,
          messageId: message.id,
          type: message.type === "text" || message.type === "image" || message.type === "interactive" ? message.type : "unsupported",
          text: extractText(message),
          mediaId: message.image?.id,
          mediaMimeType: message.image?.mime_type,
          caption: message.image?.caption,
          rawPayload: message,
          source: "webhook"
        });
      }
    }
  }

  return output;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as WhatsAppWebhookPayload | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid WhatsApp webhook payload." }, { status: 400 });
  }

  const messages = toInboundMessages(payload);

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, received: true, messageCount: 0, note: "No inbound user messages. Status events ignored." });
  }

  const results = [];

  for (const inbound of messages) {
    await logWhatsAppMessage({
      phoneNumber: inbound.phoneNumber,
      direction: "inbound",
      messageType: inbound.type,
      messageText: inbound.text ?? inbound.caption ?? null,
      payload: inbound.rawPayload,
      status: "received"
    });

    const result = await processWhatsAppInbound(inbound);
    const sendResult = result.shouldSend === false
      ? { ok: false, skipped: true, error: "Reply sending disabled by engine." }
      : await sendWhatsAppText({ to: inbound.phoneNumber, body: result.reply });

    await logWhatsAppMessage({
      phoneNumber: inbound.phoneNumber,
      direction: "outbound",
      messageType: "text",
      messageText: result.reply,
      payload: sendResult,
      status: sendResult.ok ? "sent" : sendResult.skipped ? "skipped" : "failed"
    });

    results.push({
      phoneNumber: inbound.phoneNumber,
      state: result.state,
      reportNo: result.reportNo ?? null,
      sent: sendResult.ok,
      skipped: Boolean(sendResult.skipped)
    });
  }

  return NextResponse.json({ ok: true, received: true, messageCount: messages.length, results });
}
