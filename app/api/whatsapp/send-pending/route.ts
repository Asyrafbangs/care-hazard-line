import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppText } from "@/lib/whatsapp/send";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: pending, error } = await supabase
    .from("notifications")
    .select("id, report_id, recipient_type, recipient_reporter_id, recipient_user_id, message_preview")
    .eq("channel", "whatsapp")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results = [];

  for (const notification of pending ?? []) {
    let phoneNumber: string | null = null;

    if (notification.recipient_reporter_id) {
      const { data: reporter } = await supabase
        .from("reporters")
        .select("phone_number")
        .eq("id", notification.recipient_reporter_id)
        .maybeSingle();
      phoneNumber = reporter?.phone_number ?? null;
    }

    if (!phoneNumber && notification.recipient_user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("phone_number")
        .eq("id", notification.recipient_user_id)
        .maybeSingle();
      phoneNumber = user?.phone_number ?? null;
    }

    if (!phoneNumber) {
      await supabase.from("notifications").update({ status: "failed" }).eq("id", notification.id);
      results.push({ notificationId: notification.id, ok: false, reason: "No phone number." });
      continue;
    }

    const sendResult = await sendWhatsAppText({
      to: phoneNumber,
      body: notification.message_preview ?? "CARE Hazard Line update. Please check your report status."
    });

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
      message_type: "pending_notification",
      message_text: notification.message_preview,
      payload: sendResult,
      status: sendResult.ok ? "sent" : sendResult.skipped ? "skipped" : "failed"
    });

    results.push({ notificationId: notification.id, phoneNumber, ok: sendResult.ok, skipped: Boolean(sendResult.skipped) });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
