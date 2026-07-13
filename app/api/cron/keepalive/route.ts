import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Daily Vercel cron. Performs a trivial select so the Supabase free-tier
// project registers database activity and is not paused. See CLAUDE.md
// free-tier constraint 1 — never remove or break this route.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("destinations").select("id").limit(1);

  if (error) {
    // The destinations table may not exist yet. Return 200 so the cron
    // logs stay readable; the query itself is the database activity.
    return NextResponse.json({ db: "error", message: error.message });
  }

  return NextResponse.json({ db: "ok", timestamp: new Date().toISOString() });
}
