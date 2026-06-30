import { NextResponse } from "next/server";
import { getWhatsAppApiVersion, getWhatsAppPhoneNumberInfo, isWhatsAppConfigured } from "@/lib/whatsapp/send";

export const runtime = "nodejs";

function mask(value?: string) {
  if (!value) return null;
  if (value.length <= 8) return "configured";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function isValidHttpUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildWebhookUrl(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (appUrl) return `${appUrl.replace(/\/$/, "")}/api/whatsapp/webhook`;
  const url = new URL(request.url);
  return `${url.origin}/api/whatsapp/webhook`;
}

export async function GET(request: Request) {
  const webhookUrl = buildWebhookUrl(request);
  const env = {
    WHATSAPP_VERIFY_TOKEN: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    WHATSAPP_ACCESS_TOKEN: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_GRAPH_API_VERSION: getWhatsAppApiVersion(),
    WHATSAPP_EHS_ALERT_NUMBERS: Boolean(process.env.WHATSAPP_EHS_ALERT_NUMBERS),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
  const supabase = {
    urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    urlValid: isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };

  const verificationTestUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(process.env.WHATSAPP_VERIFY_TOKEN || "your-token")}&hub.challenge=care-hazard-line-test`;
  const phoneNumberInfo = isWhatsAppConfigured() ? await getWhatsAppPhoneNumberInfo() : null;

  return NextResponse.json({
    ok: true,
    configured: isWhatsAppConfigured(),
    webhookUrl,
    verificationTestUrl,
    env,
    supabase,
    masked: {
      phoneNumberId: mask(process.env.WHATSAPP_PHONE_NUMBER_ID),
      accessToken: mask(process.env.WHATSAPP_ACCESS_TOKEN),
      supabaseUrl: mask(process.env.NEXT_PUBLIC_SUPABASE_URL)
    },
    phoneNumberInfo
  });
}
