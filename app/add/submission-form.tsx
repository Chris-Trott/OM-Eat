"use client";

import Link from "next/link";
import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { PhotoInput } from "./photo-input";

type Destination = {
  id: string;
  iata: string;
  city: string;
  country: string;
};

const inputClass =
  "mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-base";
const labelClass = "block text-sm font-semibold";

export function SubmissionForm({
  destinations,
  defaultDestinationId,
}: {
  destinations: Destination[];
  defaultDestinationId?: string;
}) {
  const [airside, setAirside] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  if (logged) {
    return (
      <section className="mt-8 rounded border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">Submission logged.</h2>
        <p className="mt-2 text-sm text-secondary">
          A curator will review this entry. If approved, it will appear on the
          destination page. No further action is required.
        </p>
        <div className="mt-4 flex gap-4 text-sm font-semibold">
          <Link href="/" className="text-accent no-underline">
            Return to home
          </Link>
          <Link href="/destinations" className="text-accent no-underline">
            Destinations
          </Link>
        </div>
      </section>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (airside === null) {
      setError("State whether the Find is airside or landside.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const value = (name: string) => (form.get(name) as string | null) ?? "";

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: value("website"), // honeypot
          destination_id: value("destination_id"),
          dish: value("dish"),
          place: value("place"),
          airside,
          terminal_area: value("terminal_area"),
          walking_time: value("walking_time"),
          cost_amount: value("cost_amount"),
          cost_currency: value("cost_currency"),
          payment: value("payment"),
          opening_hours: value("opening_hours"),
          directions: value("directions"),
          maps_url: value("maps_url"),
          submitter_display: value("submitter_display"),
          images: photos,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Submission could not be logged. Try again.");
        return;
      }

      setLogged(true);
    } catch {
      setError("Submission could not be logged. Check signal and try again.");
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
        <label className={labelClass} htmlFor="destination_id">
          Destination <span aria-hidden="true">*</span>
        </label>
        <select
          id="destination_id"
          name="destination_id"
          required
          defaultValue={defaultDestinationId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select destination
          </option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.iata} — {d.city}, {d.country}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={labelClass}>
          Airside or landside? <span aria-hidden="true">*</span>
        </legend>
        <p className="mt-1 text-xs text-secondary">
          Airside: past security. Landside: leaving the terminal required.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAirside(true)}
            aria-pressed={airside === true}
            className={`rounded border-2 px-4 py-3 font-sans text-base font-bold tracking-widest ${
              airside === true
                ? "border-ink bg-ink text-page"
                : "border-line bg-surface text-ink"
            }`}
          >
            AIRSIDE
          </button>
          <button
            type="button"
            onClick={() => setAirside(false)}
            aria-pressed={airside === false}
            className={`rounded border-2 px-4 py-3 font-sans text-base font-bold tracking-widest ${
              airside === false
                ? "border-ink bg-ink text-page"
                : "border-line bg-surface text-ink"
            }`}
          >
            LANDSIDE
          </button>
        </div>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="dish">
          Dish <span aria-hidden="true">*</span>
        </label>
        <p className="mt-1 text-xs text-secondary">
          The specific thing to eat, not the venue.
        </p>
        <input id="dish" name="dish" required maxLength={200} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="place">
          Place <span aria-hidden="true">*</span>
        </label>
        <p className="mt-1 text-xs text-secondary">Where it is sold.</p>
        <input id="place" name="place" required maxLength={200} className={inputClass} />
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
        <p className="mt-1 text-xs text-secondary">
          From the gate or terminal exit, e.g. “8 minutes”.
        </p>
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
            placeholder="4.50"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cost_currency">
            Currency
          </label>
          <select
            id="cost_currency"
            name="cost_currency"
            defaultValue=""
            className={inputClass}
          >
            <option value="">Not stated</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="payment">
          Payment
        </label>
        <select id="payment" name="payment" defaultValue="" className={inputClass}>
          <option value="">Not stated</option>
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
        <p className="mt-1 text-xs text-secondary">
          How to find it on foot. Assume the reader has 90 minutes and no data
          roaming.
        </p>
        <textarea id="directions" name="directions" rows={4} maxLength={2000} className={inputClass} />
      </div>

      <PhotoInput photos={photos} onChange={setPhotos} />

      {airside === false && (
        <div>
          <label className={labelClass} htmlFor="maps_url">
            Map link
          </label>
          <p className="mt-1 text-xs text-secondary">
            Optional. Paste a link from your maps app. Landside Finds only.
          </p>
          <input
            id="maps_url"
            name="maps_url"
            type="url"
            maxLength={500}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="submitter_display">
          Your name
        </label>
        <p className="mt-1 text-xs text-secondary">
          Optional. First name and last initial only, e.g. “Tom S”. Displayed
          against the Find if published.
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
        className="w-full rounded border-2 border-ink bg-ink px-4 py-3 font-sans text-lg font-bold text-page disabled:opacity-50"
      >
        {submitting ? "Logging…" : "Submit for review"}
      </button>
    </form>
  );
}
