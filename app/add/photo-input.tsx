"use client";

import { useRef, useState } from "react";

// Photo attachments for a submission. Compressed in the browser before
// upload — free-tier storage makes this a requirement, not an optimisation:
// ≤1600 px long edge, aiming under ~300 KB as JPEG.

export const MAX_PHOTOS = 3;

const LONG_EDGE = 1600;
// data URLs carry ~37% base64 overhead over the byte size.
const TARGET_LENGTH = 300 * 1024 * 1.37;
const HARD_LIMIT_LENGTH = 1024 * 1024 * 1.37; // bucket enforces 1 MB

async function compressToDataUrl(file: File): Promise<string | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let dataUrl = "";
  for (const quality of [0.8, 0.6, 0.4]) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= TARGET_LENGTH) return dataUrl;
  }
  return dataUrl.length <= HARD_LIMIT_LENGTH ? dataUrl : null;
}

export function PhotoInput({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    setBusy(true);
    try {
      const next = [...photos];
      for (const file of Array.from(fileList)) {
        if (next.length >= MAX_PHOTOS) break;
        const dataUrl = await compressToDataUrl(file);
        if (!dataUrl) {
          setError("That photo could not be processed. Try a different one.");
          continue;
        }
        next.push(dataUrl);
      }
      onChange(next);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="block text-sm font-semibold">Photos</span>
      <p className="mt-1 text-xs text-secondary">
        Optional, up to {MAX_PHOTOS}. Show the item, or a landmark on the
        route to it. Photos are reviewed before publication.
      </p>

      {photos.length > 0 && (
        <ul className="mt-2 flex gap-3">
          {photos.map((photo, index) => (
            <li key={index} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Attached photo ${index + 1}`}
                className="h-24 w-24 rounded border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-line bg-surface text-xs font-bold leading-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {photos.length < MAX_PHOTOS && (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded border border-line bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Processing…" : "Attach photo"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => onFiles(event.currentTarget.files)}
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
