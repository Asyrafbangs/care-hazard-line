import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "CARE Hazard Line",
    phase: "Phase 1 Foundation",
    timestamp: new Date().toISOString(),
    checks: {
      nextAppRouter: true,
      supabaseEnvConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      cloudinaryEnvConfigured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      whatsappWebhookConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN)
    }
  });
}
