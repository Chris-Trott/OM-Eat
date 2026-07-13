import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Public submission intake for new Finds and corrections. Open but
// moderated: everything lands in the submissions queue as 'pending' and
// never appears on the site until a curator publishes it. Written with the
// service role key — the anon key has no insert policy anywhere.

const PAYMENT_OPTIONS = ["cash", "card", "both"] as const;

const logged = () =>
  NextResponse.json({ message: "Submission logged. A curator will review." });

const invalid = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.length > maxLength ? null : trimmed;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return invalid("Invalid request.");
  }

  // Honeypot: humans never see or fill this field. Report success and
  // insert nothing.
  if (typeof body.website === "string" && body.website !== "") {
    return logged();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`submissions:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Submission limit reached. Try again later." },
      { status: 429 },
    );
  }

  const type = body.type === "update" ? "update" : "new_find";
  const supabase = createServiceClient();

  // Find fields, shared by both types. For a new Find some are required;
  // for an update everything is an optional correction.
  const dish = text(body.dish, 200);
  const place = text(body.place, 200);
  const airside =
    body.airside === true ? true : body.airside === false ? false : null;

  const costAmount = text(body.cost_amount, 12);
  if (costAmount !== null && !/^\d+([.,]\d{1,2})?$/.test(costAmount)) {
    return invalid("Cost must be a number.");
  }

  const costCurrency = text(body.cost_currency, 3)?.toUpperCase() ?? null;
  if (costCurrency !== null && !/^[A-Z]{3}$/.test(costCurrency)) {
    return invalid("Currency must be a three-letter code.");
  }

  const payment = text(body.payment, 10);
  if (
    payment !== null &&
    !PAYMENT_OPTIONS.includes(payment as (typeof PAYMENT_OPTIONS)[number])
  ) {
    return invalid("Invalid payment method.");
  }

  const mapsUrl = airside === true ? null : text(body.maps_url, 500);
  if (mapsUrl !== null && !/^https?:\/\//.test(mapsUrl)) {
    return invalid("Map link must be a full web address.");
  }

  const fields = {
    dish,
    place,
    airside,
    terminal_area: text(body.terminal_area, 200),
    walking_time: text(body.walking_time, 100),
    cost_amount: costAmount ? costAmount.replace(",", ".") : null,
    cost_currency: costCurrency,
    payment,
    opening_hours: text(body.opening_hours, 200),
    directions: text(body.directions, 2000),
    maps_url: mapsUrl,
  };

  let payload: Record<string, unknown>;
  let findId: string | null = null;

  if (type === "new_find") {
    if (!dish || !place || airside === null) {
      return invalid(
        "Destination, dish, place, and airside/landside are required.",
      );
    }

    // Resolve the destination server-side; use the id the database
    // returned, never the client string.
    const { data: destination } = await supabase
      .from("destinations")
      .select("id")
      .eq("id", text(body.destination_id, 36) ?? "")
      .maybeSingle();
    if (!destination) {
      return invalid("Unknown destination.");
    }

    payload = { destination_id: destination.id, ...fields };
  } else {
    const correction = text(body.body, 2000);
    if (!correction) {
      return invalid("Say what has changed.");
    }

    // Resolve the Find server-side; use the id the database returned,
    // never the client string. Must exist and be published.
    const { data: find } = await supabase
      .from("finds")
      .select("id")
      .eq("id", text(body.find_id, 36) ?? "")
      .eq("status", "published")
      .maybeSingle();
    if (!find) {
      return invalid("Unknown Find.");
    }

    findId = find.id;
    payload = { body: correction, ...fields };
  }

  const { error } = await supabase.from("submissions").insert({
    type,
    find_id: findId,
    payload,
    submitter_display: text(body.submitter_display, 40),
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Submission could not be logged. Try again." },
      { status: 500 },
    );
  }

  return logged();
}
