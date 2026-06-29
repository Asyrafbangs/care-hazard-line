import { NextResponse } from "next/server";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/messages";
import { logWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/whatsapp/send";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    to?: string;
    templateName?: string;
    languageCode?: string;
    bodyParameters?: Array<string | number>;
  } | null;

  const to = normalizeWhatsAppPhone(body?.to ?? "");
  const templateName = body?.templateName?.trim();

  if (!to || !templateName) {
    return NextResponse.json({ ok: false, error: "Recipient phone number and templateName are required." }, { status: 400 });
  }

  const result = await sendWhatsAppTemplate({
    to,
    templateName,
    languageCode: body?.languageCode,
    bodyParameters: Array.isArray(body?.bodyParameters) ? body.bodyParameters : []
  });

  await logWhatsAppMessage({
    phoneNumber: to,
    direction: "outbound",
    messageType: "production_template",
    messageText: `Template: ${templateName}`,
    payload: result,
    status: result.ok ? "sent" : result.skipped ? "skipped" : "failed"
  });

  return NextResponse.json({ ok: result.ok, result });
}
