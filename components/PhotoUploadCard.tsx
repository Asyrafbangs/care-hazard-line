"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, ImageUp, RotateCcw, Trash2 } from "lucide-react";

/**
 * Mobile-friendly photo capture/upload with preview, retake and remove.
 * The parent owns the File; this component derives a preview from it.
 */
export function PhotoUploadCard({
  file,
  onChange,
  required,
  error,
  label = "Photo evidence"
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-semibold">
        {label}
        {required ? <span className="text-safety-red"> *</span> : null}
      </p>

      {preview ? (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected hazard" className="h-44 w-full rounded-xl object-cover ring-1 ring-slate-200" />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"
            >
              <RotateCcw size={16} /> Retake
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-red-600"
            >
              <Trash2 size={16} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-800 px-3 py-3 text-sm font-semibold text-white"
          >
            <Camera size={18} /> Take photo
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
          >
            <ImageUp size={18} /> Upload
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />

      {error ? (
        <p className="mt-3 flex items-center gap-1 text-sm font-medium text-red-600">
          <AlertTriangle size={15} /> {error}
        </p>
      ) : null}
    </div>
  );
}
