import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, sendWhatsAppText } from "@/lib/whatsapp/send";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

async function resolvePhoneNumber(input: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  recipientReporterId?: string | null;
  recipientUserId?: string | null;
}) {
  if (input.recipientReporterId) {
    const { data: reporter } = await input.supabase
      .from("reporters")
      .select("phone_number")
      .eq("id", input.recipientReporterId)
      .maybeSingle();
    if (reporter?.phone_number) return reporter.phone_number;
  }

  if (input.recipientUserId) {
    const { data: user } = await input.supabase
      .from("users")
      .select("phone_number")
      .eq("id", input.recipientUserId)
      .maybeSingle();
    if (user?.phone_number) return user.phone_number;
  }

  return null;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: pending, error } = await supabase
    .from("notifications")
    .select("id, report_id, recipient_type, recipient_reporter_id, recipient_user_id, message_preview, template_key")
    .eq("channel", "whatsapp")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const defaultTemplateName = process.env.WHATSAPP_NOTIFICATION_TEMPLATE_NAME;
  const defaultTemplateLanguage = process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE || "en_US";
  const results = [];

  for (const notification of pending ?? []) {
    const phoneNumber = await resolvePhoneNumber({
      supabase,
      recipientReporterId: notification.recipient_reporter_id,
      recipientUserId: notification.recipient_user_id
    });

    if (!phoneNumber) {
      await supabase.from("notifications").update({ status: "failed" }).eq("id", notification.id);
      results.push({ notificationId: notification.id, ok: false, reason: "No phone number." });
      continue;
    }

    const preview = notification.message_preview ?? "CARE Hazard Line update. Please check your report status.";
    const templateName = notification.template_key || defaultTemplateName;
    const sendResult = templateName
      ? await sendWhatsAppTemplate({
          to: phoneNumber,
          templateName,
          languageCode: defaultTemplateLanguage,
          bodyParameters: [preview]
        })
      : await sendWhatsAppText({ to: phoneNumber, body: preview });

    await supabase
      .from("notifications")
      .update({
        status: sendResult.ok ? "sent" : "failed",
        sent_at: sendResult.ok ? new Date().toISOString() : null
      })
      .eq("id", notification.id);

    await supabase.from("whatsapp_message_logs").insert({
      phone_number: phoneNumber,
      direction: "outbound",
      message_type: templateName ? "pending_template_notification" : "pending_notification",
      message_text: preview,
      payload: sendResult,
      status: sendResult.ok ? "sent" : sendResult.skipped ? "skipped" : "failed"
    });

    results.push({ notificationId: notification.id, phoneNumber, ok: sendResult.ok, skipped: Boolean(sendResult.skipped), templateName: templateName ?? null });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
