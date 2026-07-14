import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { UpdateForm } from "./update-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Update details — OM-Eat",
};

export default async function UpdateFindPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createPublicClient();
  const { data: find } = await supabase
    .from("finds")
    .select("id, dish, place, destinations ( iata, city )")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!find) notFound();

  const destination = Array.isArray(find.destinations)
    ? find.destinations[0]
    : find.destinations;

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">Update details</h1>
      <p className="mt-2 text-sm text-secondary">
        Reporting a correction to{" "}
        <strong>
          {find.dish}, {find.place}
        </strong>{" "}
        at {destination?.iata} {destination?.city}. Corrections are reviewed by
        a curator before the record is amended.
      </p>
      <UpdateForm findId={find.id} />
    </main>
  );
}
