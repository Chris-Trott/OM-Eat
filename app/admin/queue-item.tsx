"use client";

import { useState, useTransition } from "react";
import {
  applyUpdate,
  publishNewFind,
  rejectSubmission,
} from "./actions";
import { FindFields, readFindFields } from "./find-fields";
import { findImageUrl } from "@/lib/images";

type Submission = {
  id: string;
  type: string;
  find_id: string | null;
  payload: Record<string, unknown>;
  submitter_display: string | null;
  created_at: string;
};

// Fields an update can correct, with display labels for the diff view.
const DIFF_FIELDS: [string, string][] = [
  ["dish", "Dish"],
  ["place", "Place"],
  ["airside", "Airside/landside"],
  ["terminal_area", "Terminal or area"],
  ["walking_time", "Walking time"],
  ["cost_amount", "Cost"],
  ["cost_currency", "Currency"],
  ["payment", "Payment"],
  ["opening_hours", "Opening hours"],
  ["directions", "Directions"],
  ["maps_url", "Map link"],
];

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value === true) return "Airside";
  if (value === false) return "Landside";
  return String(value);
}

export function QueueItem({
  submission,
  destinationLabel,
  currentFind,
}: {
  submission: Submission;
  destinationLabel: string | null;
  currentFind: Record<string, unknown> | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const payload = submission.payload;

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  };

  const logged = new Date(submission.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <li className="rounded border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="font-mono text-xs font-bold uppercase">
            {submission.type === "new_find" ? "New Find" : "Update"}
          </span>
          <span className="block text-base font-bold">
            {submission.type === "new_find"
              ? `${display(payload.dish)} — ${destinationLabel}`
              : `${display(currentFind?.dish)} (${display(currentFind?.place)})`}
          </span>
          <span className="block text-xs text-secondary">
            Logged {logged}
            {submission.submitter_display
              ? ` by ${submission.submitter_display}`
              : ""}
          </span>
        </span>
        <span aria-hidden="true" className="text-sm">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-4">
          {submission.type === "new_find" ? (
            <NewFindReview
              submissionId={submission.id}
              payload={payload}
              pending={pending}
              run={run}
            />
          ) : (
            <UpdateReview
              submissionId={submission.id}
              payload={payload}
              currentFind={currentFind}
              pending={pending}
              run={run}
            />
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded border border-red-700 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// Fields render pre-filled from the payload; publishing sends the current
// form values, so an untouched form is a plain Publish and any change is
// Edit then publish — one code path.
function NewFindReview({
  submissionId,
  payload,
  pending,
  run,
}: {
  submissionId: string;
  payload: Record<string, unknown>;
  pending: boolean;
  run: (action: () => Promise<{ error?: string }>) => void;
}) {
  const imagePaths = Array.isArray(payload.image_paths)
    ? payload.image_paths.filter((p): p is string => typeof p === "string")
    : [];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const edits = readFindFields(new FormData(event.currentTarget));
        run(() => publishNewFind(submissionId, edits));
      }}
    >
      {imagePaths.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold">Attached photos</p>
          <div className="mt-2 flex gap-3">
            {imagePaths.map((path) => (
              <a key={path} href={findImageUrl(path)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={findImageUrl(path)}
                  alt="Submitted photo"
                  className="h-24 w-24 rounded border border-line object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
      <FindFields values={payload} />
      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded bg-ink px-4 py-3 font-bold text-page disabled:opacity-50"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => rejectSubmission(submissionId))}
          className="rounded border border-line px-4 py-3 font-bold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </form>
  );
}

// Updates never auto-apply: the curator ticks the corrections to accept,
// field by field, against the current record.
function UpdateReview({
  submissionId,
  payload,
  currentFind,
  pending,
  run,
}: {
  submissionId: string;
  payload: Record<string, unknown>;
  currentFind: Record<string, unknown> | null;
  pending: boolean;
  run: (action: () => Promise<{ error?: string }>) => void;
}) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  if (!currentFind) {
    return (
      <div>
        <p className="text-sm">
          The Find this update refers to no longer exists. Reject to clear it
          from the queue.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => rejectSubmission(submissionId))}
          className="mt-4 rounded border border-line px-4 py-3 font-bold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  const changes = DIFF_FIELDS.filter(([key]) => {
    const proposed = payload[key];
    if (proposed == null || proposed === "") return false;
    return display(proposed) !== display(currentFind[key]);
  });

  const imagePaths = Array.isArray(payload.image_paths)
    ? payload.image_paths.filter((p): p is string => typeof p === "string")
    : [];

  const toggle = (key: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const apply = () => {
    const fields: Record<string, unknown> = {};
    for (const key of accepted) fields[key] = payload[key];
    run(() => applyUpdate(submissionId, fields));
  };

  return (
    <div>
      <p className="text-sm font-semibold">Report</p>
      <p className="mt-1 whitespace-pre-wrap rounded border border-line px-3 py-2 text-sm">
        {display(payload.body)}
      </p>

      {imagePaths.length > 0 && (
        <div className="mt-4 rounded border border-line p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={accepted.has("image_paths")}
              onChange={() => toggle("image_paths")}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm font-semibold">
              Attach submitted photos to the record
            </span>
          </label>
          <div className="mt-2 flex gap-3">
            {imagePaths.map((path) => (
              <a key={path} href={findImageUrl(path)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={findImageUrl(path)}
                  alt="Submitted photo"
                  className="h-24 w-24 rounded border border-line object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {changes.length > 0 ? (
        <>
          <p className="mt-4 text-sm font-semibold">
            Proposed field corrections — tick to accept
          </p>
          <ul className="mt-2 space-y-2">
            {changes.map(([key, label]) => (
              <li key={key} className="rounded border border-line p-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={accepted.has(key)}
                    onChange={() => toggle(key)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{label}</span>
                    <span className="block text-secondary line-through">
                      {display(currentFind[key])}
                    </span>
                    <span className="block">{display(payload[key])}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-secondary">
          No field corrections proposed. Applying marks the report handled
          without changing the record.
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={apply}
          className="flex-1 rounded bg-ink px-4 py-3 font-bold text-page disabled:opacity-50"
        >
          {accepted.size > 0
            ? `Apply ${accepted.size} and mark handled`
            : "Mark handled"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => rejectSubmission(submissionId))}
          className="rounded border border-line px-4 py-3 font-bold disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
