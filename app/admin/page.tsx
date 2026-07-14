import { createAuthClient } from "@/lib/supabase/auth";
import { QueueItem } from "./queue-item";

// The queue: pending submissions, oldest first. For updates we also fetch
// the current Find so the client can render a field-by-field diff.

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const supabase = await createAuthClient();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, type, find_id, payload, submitter_display, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: destinations } = await supabase
    .from("destinations")
    .select("id, iata, city");
  const destinationById = new Map(
    (destinations ?? []).map((d) => [d.id, `${d.iata} ${d.city}`]),
  );

  const findIds = (submissions ?? [])
    .map((s) => s.find_id)
    .filter((id): id is string => id !== null);
  const { data: finds } = findIds.length
    ? await supabase.from("finds").select("*").in("id", findIds)
    : { data: [] };
  const findById = new Map((finds ?? []).map((f) => [f.id, f]));

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">Submission queue</h1>
      <p className="mt-1 text-sm text-secondary">
        {submissions?.length
          ? `${submissions.length} pending, oldest first.`
          : "Queue clear. No action required."}
      </p>

      <ul className="mt-6 space-y-4">
        {(submissions ?? []).map((s) => (
          <QueueItem
            key={s.id}
            submission={s}
            destinationLabel={
              s.type === "new_find"
                ? (destinationById.get(
                    (s.payload as Record<string, unknown>)
                      .destination_id as string,
                  ) ?? "Unknown destination")
                : null
            }
            currentFind={s.find_id ? (findById.get(s.find_id) ?? null) : null}
          />
        ))}
      </ul>
    </main>
  );
}
