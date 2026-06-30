import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { WhatsAppStoredPhoto } from "@/lib/whatsapp/types";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp/messages";

function extensionFromMime(mimeType?: string | null) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "image/heif") return "heif";
  return "jpg";
}

export interface StoredWhatsAppImage {
  photo: WhatsAppStoredPhoto;
  // Base64-encoded image bytes for downstream vision analysis. Null for the
  // simulator (no real image) — never persisted to the session/draft.
  dataBase64: string | null;
}

export async function storeWhatsAppImage(input: {
  phoneNumber: string;
  mediaId: string;
  mimeType?: string | null;
  source?: "webhook" | "simulator";
}): Promise<StoredWhatsAppImage> {
  if (input.source === "simulator" || input.mediaId.startsWith("simulated")) {
    return {
      photo: {
        provider: "legacy",
        bucket: null,
        path: null,
        originalFileName: "whatsapp-simulator-photo.jpg",
        mimeType: input.mimeType ?? "image/jpeg",
        sizeBytes: 0,
        mediaId: input.mediaId
      },
      dataBase64: null
    };
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  const bucket = process.env.SUPABASE_HAZARD_PHOTOS_BUCKET || "hazard-photos";

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is required to download WhatsApp media.");
  }

  const mediaMetaResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${input.mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const mediaMeta = await mediaMetaResponse.json().catch(() => null);

  if (!mediaMetaResponse.ok || !mediaMeta?.url) {
    throw new Error(mediaMeta?.error?.message ?? "Could not get WhatsApp media URL.");
  }

  const mediaResponse = await fetch(mediaMeta.url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!mediaResponse.ok) {
    throw new Error(`Could not download WhatsApp media. HTTP ${mediaResponse.status}`);
  }

  const arrayBuffer = await mediaResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = mediaMeta.mime_type ?? input.mimeType ?? mediaResponse.headers.get("content-type") ?? "image/jpeg";
  const extension = extensionFromMime(mimeType);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const safePhone = normalizeWhatsAppPhone(input.phoneNumber);
  const fileName = `${randomUUID()}-whatsapp.${extension}`;
  const storagePath = `whatsapp/${year}/${month}/${safePhone}/${fileName}`;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    photo: {
      provider: "supabase",
      bucket,
      path: storagePath,
      originalFileName: fileName,
      mimeType,
      sizeBytes: buffer.byteLength,
      mediaId: input.mediaId
    },
    dataBase64: buffer.toString("base64")
  };
}
