"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFindImages, removeFindImage } from "@/app/admin/actions";
import { PhotoInput, MAX_PHOTOS } from "@/app/add/photo-input";
import { findImageUrl } from "@/lib/images";

type FindImage = {
  id: string;
  storage_path: string;
  alt_text: string;
};

// Curator photo management for a published Find: remove existing photos or
// stage new ones (compressed in the browser, same pipeline as submissions).
export function FindPhotos({
  findId,
  images,
}: {
  findId: string;
  images: FindImage[];
}) {
  const router = useRouter();
  const [staged, setStaged] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="text-sm font-bold uppercase tracking-widest">Photos</h2>

      {images.length > 0 ? (
        <ul className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={findImageUrl(image.storage_path)}
                alt={image.alt_text}
                className="h-24 w-24 rounded border border-line object-cover"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeFindImage(image.id))}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-line bg-surface text-xs font-bold leading-none disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-secondary">
          No photos on this record.
        </p>
      )}

      {images.length < MAX_PHOTOS && (
        <div className="mt-4">
          <PhotoInput photos={staged} onChange={setStaged} />
          {staged.length > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await addFindImages(findId, staged);
                  if (!result.error) setStaged([]);
                  return result;
                })
              }
              className="mt-3 rounded bg-ink px-4 py-2 text-sm font-bold text-page disabled:opacity-50"
            >
              {pending
                ? "Uploading…"
                : `Add ${staged.length} photo${staged.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded border border-red-700 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </section>
  );
}
