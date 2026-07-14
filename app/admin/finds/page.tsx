import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/auth";

// All Finds, published and archived, for curator editing.

export const dynamic = "force-dynamic";

export default async function AdminFindsPage() {
  const supabase = await createAuthClient();

  const { data: finds } = await supabase
    .from("finds")
    .select("id, dish, place, airside, status, destinations (iata, city)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">Finds</h1>
      <p className="mt-1 text-sm text-secondary">
        {finds?.length
          ? `${finds.length} on record, newest first.`
          : "No Finds on record."}
      </p>

      <ul className="mt-6">
        {(finds ?? []).map((f) => {
          const destination = Array.isArray(f.destinations)
            ? f.destinations[0]
            : f.destinations;
          return (
            <li key={f.id} className="border-b border-line">
              <Link href={`/admin/finds/${f.id}`} className="block py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{f.dish}</p>
                    <p className="text-sm">
                      {f.place}
                      {destination
                        ? ` — ${destination.iata} ${destination.city}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase">
                    {f.status === "archived"
                      ? "Archived"
                      : f.airside
                        ? "Airside"
                        : "Landside"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
