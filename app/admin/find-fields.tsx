"use client";

import { CURRENCIES } from "@/lib/currencies";

// Shared curator field editor: used pre-filled from a submission payload in
// the queue (edit then publish) and from the live row on the Find edit page.
// Values come back as strings; empty means null. The server action does the
// numeric cast and the airside/maps_url rule.

const inputClass =
  "mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-base";
const labelClass = "block text-sm font-semibold";

export type FindFieldValues = Record<string, unknown>;

export function readFindFields(form: FormData): FindFieldValues {
  const value = (name: string) => {
    const raw = ((form.get(name) as string | null) ?? "").trim();
    return raw === "" ? null : raw;
  };
  const airside = value("airside");
  return {
    dish: value("dish"),
    place: value("place"),
    airside:
      airside === "airside" ? true : airside === "landside" ? false : null,
    terminal_area: value("terminal_area"),
    walking_time: value("walking_time"),
    cost_amount: value("cost_amount"),
    cost_currency: value("cost_currency"),
    payment: value("payment"),
    opening_hours: value("opening_hours"),
    directions: value("directions"),
    maps_url: value("maps_url"),
    crew_discount: form.get("crew_discount") === "on",
  };
}

export function FindFields({ values }: { values: FindFieldValues }) {
  const text = (key: string) =>
    values[key] == null ? "" : String(values[key]);
  const airsideDefault =
    values.airside === true
      ? "airside"
      : values.airside === false
        ? "landside"
        : "";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="dish">
          Dish
        </label>
        <input id="dish" name="dish" maxLength={200} defaultValue={text("dish")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="place">
          Place
        </label>
        <input id="place" name="place" maxLength={200} defaultValue={text("place")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="airside">
          Airside or landside
        </label>
        <select id="airside" name="airside" defaultValue={airsideDefault} className={inputClass}>
          <option value="">Not stated</option>
          <option value="airside">Airside</option>
          <option value="landside">Landside</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="terminal_area">
          Terminal or area
        </label>
        <input id="terminal_area" name="terminal_area" maxLength={200} defaultValue={text("terminal_area")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="walking_time">
          Walking time
        </label>
        <input id="walking_time" name="walking_time" maxLength={100} defaultValue={text("walking_time")} className={inputClass} />
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
            defaultValue={text("cost_amount")}
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
            defaultValue={text("cost_currency")}
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
        <select id="payment" name="payment" defaultValue={text("payment")} className={inputClass}>
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
        <input id="opening_hours" name="opening_hours" maxLength={200} defaultValue={text("opening_hours")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="directions">
          Directions
        </label>
        <textarea id="directions" name="directions" rows={4} maxLength={2000} defaultValue={text("directions")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="maps_url">
          Map link (landside only)
        </label>
        <input
          id="maps_url"
          name="maps_url"
          type="url"
          maxLength={500}
          defaultValue={text("maps_url")}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="crew_discount"
            defaultChecked={values.crew_discount === true}
            className="mt-1 h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-semibold">Crew discount</span>
            <span className="block text-xs text-secondary">
              Discount available on production of ID. Recorded only; not yet
              shown on the public site.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
