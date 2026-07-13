import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Unmoderated write: one tap says "this information is correct" and updates
// the public freshness line immediately. One confirm per device per Find,
// enforced by the unique constraint on (find_id, device_hash). The cookie
// holds a random opaque token; the database only ever sees its SHA-256.
// Honest-system security — stops double taps and casual re-confirms, not a
// determined actor clearing cookies.

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`confirms:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Confirmation limit reached. Try again later." },
      { status: 429 },
    );
  }

  const findIdInput =
    typeof body.find_id === "string" ? body.find_id.slice(0, 36) : "";

  const supabase = createServiceClient();

  // Resolve the Find server-side; use the id the database returned.
  const { data: find } = await supabase
    .from("finds")
    .select("id")
    .eq("id", findIdInput)
    .eq("status", "published")
    .maybeSingle();
  if (!find) {
    return NextResponse.json({ error: "Unknown Find." }, { status: 400 });
  }

  const existing = request.cookies.get("omeat_device")?.value ?? null;
  const token =
    existing && /^[A-Za-z0-9_-]{43}$/.test(existing)
      ? existing
      : randomBytes(32).toString("base64url");

  const deviceHash = createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("confirms").insert({
    find_id: find.id,
    device_hash: deviceHash,
  });

  // 23505 = unique violation: this device already confirmed this Find.
  // Fail closed — no second row, and the trigger never fired.
  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "Confirmation could not be logged. Try again." },
      { status: 500 },
    );
  }

  const { data: updated } = await supabase
    .from("finds")
    .select("confirm_count, last_confirmed_at")
    .eq("id", find.id)
    .single();

  const response = NextResponse.json({
    already_confirmed: Boolean(error),
    confirm_count: updated?.confirm_count ?? null,
    last_confirmed_at: updated?.last_confirmed_at ?? null,
  });

  response.cookies.set("omeat_device", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
