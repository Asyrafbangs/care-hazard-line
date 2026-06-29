import { createSupabaseAdmin } from "@/lib/supabase-admin";

type SendResult =
  | { ok: true; skipped?: false; response?: unknown }
  | { ok: false; skipped?: boolean; error: string; response?: unknown };

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppText(input: { to: string; body: string }): Promise<SendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      skipped: true,
      error: "WhatsApp sending skipped because WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured."
    };
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: {
        preview_url: false,
        body: input.body
      }
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      error: result?.error?.message ?? `WhatsApp send failed with HTTP ${response.status}`,
      response: result
    };
  }

  return { ok: true, response: result };
}

export async function logWhatsAppMessage(input: {
  phoneNumber: string;
  direction: "inbound" | "outbound";
  messageType: string;
  messageText?: string | null;
  payload?: unknown;
  status?: "received" | "sent" | "failed" | "skipped";
}) {
  const supabase = createSupabaseAdmin();

  await supabase.from("whatsapp_message_logs").insert({
    phone_number: input.phoneNumber,
    direction: input.direction,
    message_type: input.messageType,
    message_text: input.messageText ?? null,
    payload: input.payload ?? null,
    status: input.status ?? (input.direction === "inbound" ? "received" : "sent")
  });
}
