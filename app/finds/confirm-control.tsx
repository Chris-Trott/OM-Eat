"use client";

import { useEffect, useState } from "react";

// One-tap accuracy signal. Never merged with Rating (quality) — hard rule.

const STORAGE_KEY = "omeat_confirmed_finds";

function confirmedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function freshnessLine(
  confirmCount: number,
  lastConfirmedAt: string | null,
) {
  if (confirmCount < 1 || !lastConfirmedAt) {
    return "Awaiting first confirmation.";
  }
  const date = new Date(lastConfirmedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Confirmed by ${confirmCount} crew, last on ${date}.`;
}

export function ConfirmControl({
  findId,
  initialCount,
  initialLastConfirmedAt,
}: {
  findId: string;
  initialCount: number;
  initialLastConfirmedAt: string | null;
}) {
  const [count, setCount] = useState(initialCount);
  const [lastConfirmedAt, setLastConfirmedAt] = useState(
    initialLastConfirmedAt,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (confirmedIds().includes(findId)) setConfirmed(true);
  }, [findId]);

  async function onConfirm() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/confirms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ find_id: findId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Confirmation could not be logged.");
        return;
      }

      const data = await res.json();
      if (typeof data.confirm_count === "number") {
        setCount(data.confirm_count);
        setLastConfirmedAt(data.last_confirmed_at);
      }
      setConfirmed(true);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([...new Set([...confirmedIds(), findId])]),
        );
      } catch {
        // localStorage unavailable: the cookie still blocks a repeat.
      }
    } catch {
      setError("Confirmation could not be logged. Check signal.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {freshnessLine(count, lastConfirmedAt)}
      </p>
      {confirmed ? (
        <p className="mt-2 inline-block rounded border border-line px-3 py-2 text-sm font-semibold text-secondary">
          👍 Confirmed on this device.
        </p>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={sending}
          className="mt-2 rounded border-2 border-accent px-4 py-2 font-sans text-sm font-bold text-accent disabled:opacity-50"
        >
          {sending ? "Logging…" : "👍 Still correct"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
