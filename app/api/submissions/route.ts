import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { FIND_IMAGES_BUCKET } from "@/lib/images";

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
    return invalid("Price must be a number.");
  }

  const costQty =
    body.cost_qty == null || body.cost_qty === ""
      ? null
      : Number(body.cost_qty);
  if (
    costQty !== null &&
    (!Number.isInteger(costQty) || costQty < 1 || costQty > 99)
  ) {
    return invalid("Quantity must be picked from the list.");
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
    walking_time: text(body.walking_time, 100),
    cost_amount: costAmount ? costAmount.replace(",", ".") : null,
    cost_qty: costQty,
    // Tri-state: true/false from a stated answer, null means not stated
    // (a correction that leaves it alone).
    crew_discount:
      body.crew_discount === true
        ? true
        : body.crew_discount === false
          ? false
          : null,
    payment,
    opening_hours: text(body.opening_hours, 200),
    directions: text(body.directions, 2000),
    maps_url: mapsUrl,
  };

  let payload: Record<string, unknown>;
  let findId: string | null = null;

  // Photos, allowed on both types: compressed client-side, capped again here
  // (the bucket also enforces 1 MB). They land in an unlisted submissions/
  // path and are only linked to a Find if a curator publishes or applies.
  // Returns a NextResponse on failure. Called only after the destination or
  // Find has been resolved, so an invalid submission uploads nothing.
  async function uploadImages(): Promise<string[] | NextResponse> {
    const imagePaths: string[] = [];
    const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
    for (const image of images) {
      const match =
        typeof image === "string"
          ? image.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/)
          : null;
      if (!match) return invalid("Photos must be attached via the form.");
      const bytes = Buffer.from(match[1], "base64");
      if (bytes.length > 1024 * 1024) {
        return invalid("Each photo must be under 1 MB.");
      }
      const path = `submissions/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(FIND_IMAGES_BUCKET)
        .upload(path, bytes, { contentType: "image/jpeg" });
      if (uploadError) {
        return NextResponse.json(
          { error: "Photo upload failed. Try again." },
          { status: 500 },
        );
      }
      imagePaths.push(path);
    }
    return imagePaths;
  }

  if (type === "new_find") {
    if (!dish || !place || airside === null) {
      return invalid(
        "Destination, dish, vendor/area, and airside/landside are required.",
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

    const imagePaths = await uploadImages();
    if (imagePaths instanceof NextResponse) return imagePaths;

    payload = { destination_id: destination.id, ...fields };
    if (imagePaths.length > 0) payload.image_paths = imagePaths;
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

    const imagePaths = await uploadImages();
    if (imagePaths instanceof NextResponse) return imagePaths;

    findId = find.id;
    payload = { body: correction, ...fields };
    if (imagePaths.length > 0) payload.image_paths = imagePaths;
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
