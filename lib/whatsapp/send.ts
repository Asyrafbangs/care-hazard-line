import { createSupabaseAdmin } from "@/lib/supabase-admin";

type SendResult =
  | { ok: true; skipped?: false; response?: unknown }
  | { ok: false; skipped?: boolean; error: string; response?: unknown };

export function getWhatsAppApiVersion() {
  return process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
}

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: getWhatsAppApiVersion()
  };
}

async function parseGraphResponse(response: Response) {
  return response.json().catch(() => null);
}

export async function sendWhatsAppText(input: { to: string; body: string }): Promise<SendResult> {
  const { accessToken, phoneNumberId, apiVersion } = getWhatsAppConfig();

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

  const result = await parseGraphResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      error: result?.error?.message ?? `WhatsApp send failed with HTTP ${response.status}`,
      response: result
    };
  }

  return { ok: true, response: result };
}

export async function sendWhatsAppTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: Array<string | number>;
}): Promise<SendResult> {
  const { accessToken, phoneNumberId, apiVersion } = getWhatsAppConfig();

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      skipped: true,
      error: "WhatsApp template sending skipped because WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured."
    };
  }

  const components = input.bodyParameters?.length
    ? [
        {
          type: "body",
          parameters: input.bodyParameters.map((parameter) => ({
            type: "text",
            text: String(parameter)
          }))
        }
      ]
    : undefined;

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
      type: "template",
      template: {
        name: input.templateName,
        language: {
          code: input.languageCode || process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE || "en_US"
        },
        ...(components ? { components } : {})
      }
    })
  });

  const result = await parseGraphResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      error: result?.error?.message ?? `WhatsApp template send failed with HTTP ${response.status}`,
      response: result
    };
  }

  return { ok: true, response: result };
}

export async function getWhatsAppPhoneNumberInfo() {
  const { accessToken, phoneNumberId, apiVersion } = getWhatsAppConfig();

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      skipped: true,
      error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured."
    };
  }

  const fields = [
    "display_phone_number",
    "verified_name",
    "quality_rating",
    "code_verification_status",
    "platform_type",
    "throughput"
  ].join(",");

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      error: result?.error?.message ?? `Could not read WhatsApp phone number info. HTTP ${response.status}`,
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

  const { error } = await supabase.from("whatsapp_message_logs").insert({
    phone_number: input.phoneNumber,
    direction: input.direction,
    message_type: input.messageType,
    message_text: input.messageText ?? null,
    payload: input.payload ?? null,
    status: input.status ?? (input.direction === "inbound" ? "received" : "sent")
  });

  if (error) {
    throw new Error(`Could not log WhatsApp message: ${error.message}`);
  }
}
