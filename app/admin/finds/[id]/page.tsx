import { notFound } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth";
import { FindEditor } from "./find-editor";

export const dynamic = "force-dynamic";

export default async function AdminFindEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAuthClient();

  const { data: find } = await supabase
    .from("finds")
    .select("*, destinations (iata, city)")
    .eq("id", id)
    .maybeSingle();

  if (!find) notFound();

  const destination = Array.isArray(find.destinations)
    ? find.destinations[0]
    : find.destinations;

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <p className="font-mono text-sm font-bold">
        {destination ? `${destination.iata} ${destination.city}` : ""}
      </p>
      <h1 className="text-2xl font-bold">{find.dish}</h1>
      <p className="text-sm text-secondary">{find.place}</p>

      <FindEditor find={find} />
    </main>
  );
}
