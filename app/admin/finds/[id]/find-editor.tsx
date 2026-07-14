"use client";

import { useState, useTransition } from "react";
import { setFindStatus, updateFind } from "@/app/admin/actions";
import { FindFields, readFindFields } from "@/app/admin/find-fields";

export function FindEditor({ find }: { find: Record<string, unknown> }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(find.status as string);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string }>, done: string) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else setNotice(done);
    });
  };

  return (
    <div className="mt-6">
      {status === "archived" && (
        <p className="mb-4 rounded border border-line px-3 py-2 text-sm font-semibold">
          Archived. Not shown on the public site.
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const fields = readFindFields(new FormData(event.currentTarget));
          run(() => updateFind(find.id as string, fields), "Record amended.");
        }}
      >
        <FindFields values={find} />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded border border-red-700 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded border border-line px-3 py-2 text-sm font-semibold">
            {notice}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded bg-ink px-4 py-3 font-bold text-page disabled:opacity-50"
          >
            Save changes
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const next = status === "archived" ? "published" : "archived";
              run(
                () => setFindStatus(find.id as string, next),
                next === "archived" ? "Record archived." : "Record restored.",
              );
              setStatus(next);
            }}
            className="rounded border border-line px-4 py-3 font-bold disabled:opacity-50"
          >
            {status === "archived" ? "Restore" : "Archive"}
          </button>
        </div>
      </form>
    </div>
  );
}
