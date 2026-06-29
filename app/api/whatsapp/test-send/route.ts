import { NextResponse } from "next/server";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/messages";
import { logWhatsAppMessage, sendWhatsAppText } from "@/lib/whatsapp/send";

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

  const body = await request.json().catch(() => null) as { to?: string; message?: string } | null;
  const to = normalizeWhatsAppPhone(body?.to ?? "");

  if (!to) {
    return NextResponse.json({ ok: false, error: "Valid recipient phone number is required." }, { status: 400 });
  }

  const message = body?.message?.trim() || "CARE Hazard Line WhatsApp production connection test.";
  const result = await sendWhatsAppText({ to, body: message });

  await logWhatsAppMessage({
    phoneNumber: to,
    direction: "outbound",
    messageType: "production_test_text",
    messageText: message,
    payload: result,
    status: result.ok ? "sent" : result.skipped ? "skipped" : "failed"
  });

  return NextResponse.json({ ok: result.ok, result });
}
