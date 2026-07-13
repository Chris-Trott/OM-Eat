"use client";

import { useState } from "react";

const inputClass =
  "mt-1 w-full rounded border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm font-semibold";

export function UpdateForm({ findId }: { findId: string }) {
  const [showCorrections, setShowCorrections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  if (logged) {
    return (
      <section className="mt-8 rounded border border-neutral-400 p-6">
        <h2 className="text-lg font-bold">Correction logged.</h2>
        <p className="mt-2 text-sm">
          A curator will review this report against the current record. No
          further action is required.
        </p>
      </section>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const value = (name: string) => (form.get(name) as string | null) ?? "";
    const airsideValue = value("airside");

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update",
          find_id: findId,
          website: value("website"), // honeypot
          body: value("body"),
          dish: value("dish"),
          place: value("place"),
          airside:
            airsideValue === "airside"
              ? true
              : airsideValue === "landside"
                ? false
                : null,
          terminal_area: value("terminal_area"),
          walking_time: value("walking_time"),
          cost_amount: value("cost_amount"),
          cost_currency: value("cost_currency"),
          payment: value("payment"),
          opening_hours: value("opening_hours"),
          directions: value("directions"),
          maps_url: value("maps_url"),
          submitter_display: value("submitter_display"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Correction could not be logged. Try again.");
        return;
      }

      setLogged(true);
    } catch {
      setError("Correction could not be logged. Check signal and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
      {/* Honeypot: hidden from humans, present for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="body">
          What has changed? <span aria-hidden="true">*</span>
        </label>
        <p className="mt-1 text-xs text-neutral-600">
          Closed down, moved, price rise, new hours — state the facts.
        </p>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowCorrections((v) => !v)}
        aria-expanded={showCorrections}
        className="text-sm font-semibold underline"
      >
        {showCorrections
          ? "Hide field corrections"
          : "Correct specific fields (optional)"}
      </button>

      {showCorrections && (
        <div className="space-y-5 rounded border border-neutral-300 p-4">
          <p className="text-xs text-neutral-600">
            Fill in only the fields that are wrong. Everything here is
            optional.
          </p>

          <div>
            <label className={labelClass} htmlFor="dish">
              Dish
            </label>
            <input id="dish" name="dish" maxLength={200} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="place">
              Place
            </label>
            <input id="place" name="place" maxLength={200} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="airside">
              Airside or landside
            </label>
            <select id="airside" name="airside" defaultValue="" className={inputClass}>
              <option value="">No change</option>
              <option value="airside">Airside</option>
              <option value="landside">Landside</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="terminal_area">
              Terminal or area
            </label>
            <input id="terminal_area" name="terminal_area" maxLength={200} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="walking_time">
              Walking time
            </label>
            <input id="walking_time" name="walking_time" maxLength={100} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="cost_amount">
                Cost
              </label>
              <input
                id="cost_amount"
                name="cost_amount"
                inputMode="decimal"
                maxLength={12}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cost_currency">
                Currency
              </label>
              <input
                id="cost_currency"
                name="cost_currency"
                maxLength={3}
                autoCapitalize="characters"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="payment">
              Payment
            </label>
            <select id="payment" name="payment" defaultValue="" className={inputClass}>
              <option value="">No change</option>
              <option value="cash">Cash only</option>
              <option value="card">Card only</option>
              <option value="both">Cash or card</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="opening_hours">
              Opening hours
            </label>
            <input id="opening_hours" name="opening_hours" maxLength={200} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="directions">
              Directions
            </label>
            <textarea id="directions" name="directions" rows={4} maxLength={2000} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="maps_url">
              Map link
            </label>
            <p className="mt-1 text-xs text-neutral-600">Landside Finds only.</p>
            <input
              id="maps_url"
              name="maps_url"
              type="url"
              maxLength={500}
              placeholder="https://…"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="submitter_display">
          Your name
        </label>
        <p className="mt-1 text-xs text-neutral-600">
          Optional. First name and last initial only, e.g. “Chris T”.
        </p>
        <input id="submitter_display" name="submitter_display" maxLength={40} className={inputClass} />
      </div>

      {error && (
        <p role="alert" className="rounded border border-red-700 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-black px-4 py-3 text-base font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Logging…" : "Submit correction"}
      </button>
    </form>
  );
}
