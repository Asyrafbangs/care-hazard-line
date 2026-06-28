"use client";

import { useState } from "react";
import { Eye, ImageIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";

type SignedUrlResponse = {
  ok: boolean;
  signedUrl?: string;
  expiresInSeconds?: number;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  error?: string;
};

export function SecurePhotoPreview({
  reportNo,
  photoId,
  photoType = "hazard",
  viewerRole = "ehs",
  fileName
}: {
  reportNo: string;
  photoId?: string;
  photoType?: "hazard" | "closure" | "verification";
  viewerRole?: "ehs" | "action_owner";
  fileName?: string | null;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadPhoto() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportNo, photoId, photoType, viewerRole })
      });
      const result = (await response.json()) as SignedUrlResponse;

      if (!response.ok || !result.ok || !result.signedUrl) {
        throw new Error(result.error ?? "Photo could not be loaded.");
      }

      setSignedUrl(result.signedUrl);
      setExpiresInSeconds(result.expiresInSeconds ?? null);
    } catch (loadError) {
      setSignedUrl(null);
      setError(loadError instanceof Error ? loadError.message : "Photo could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <ShieldCheck size={14} /> Secure photo evidence
          </p>
          <h3 className="mt-1 text-base font-bold text-safety-ink">{fileName ?? "Hazard photo"}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Private Supabase Storage file. A temporary signed URL is generated only when viewed.
          </p>
        </div>
        <ImageIcon className="text-slate-400" />
      </div>

      {signedUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signedUrl} alt="Hazard evidence" className="max-h-[520px] w-full object-contain" />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Photo is protected. Click view to generate a short-lived access link.
        </div>
      )}

      {expiresInSeconds ? (
        <p className="mt-3 text-xs text-slate-500">This photo link expires in about {Math.round(expiresInSeconds / 60)} minutes.</p>
      ) : null}

      {error ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <Button onClick={loadPhoto} disabled={isLoading} className="gap-2">
          {signedUrl ? <RefreshCw size={16} /> : <Eye size={16} />}
          {isLoading ? "Loading..." : signedUrl ? "Refresh secure link" : "View photo"}
        </Button>
      </div>
    </div>
  );
}
