import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { AirsideBadge } from "@/app/finds/airside-badge";
import { countryFlag } from "@/lib/flags";

export const revalidate = 60;

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, iata, city, country")
    .eq("slug", slug)
    .maybeSingle();

  if (!destination) notFound();

  const { data: finds } = await supabase
    .from("finds")
    .select("id, dish, place, airside, walking_time")
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .order("created_at");

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <p className="font-mono text-sm font-bold">{destination.iata}</p>
      <h1 className="text-2xl font-bold">{destination.city}</h1>
      <p className="text-sm text-secondary">
        <span aria-hidden="true">{countryFlag(destination.country)}</span>{" "}
        {destination.country}
      </p>

      {!finds?.length ? (
        <section className="mt-10 rounded border border-line bg-surface p-6 text-center">
          <p className="font-sans text-lg font-bold">
            Nothing found here yet. Be the first.
          </p>
          <Link
            href={`/add?destination=${slug}`}
            className="mt-4 inline-block rounded border-2 border-ink bg-ink px-6 py-3 font-sans font-bold text-page no-underline"
          >
            Add a Find
          </Link>
        </section>
      ) : (
        <ul className="mt-6">
          {finds.map((f) => (
            <li key={f.id} className="border-b border-line">
              <Link
                href={`/finds/${f.id}`}
                className="block py-4 text-ink no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-lg font-bold">{f.dish}</p>
                    <p className="text-sm">{f.place}</p>
                    {f.walking_time && (
                      <p className="mt-1 text-xs text-muted">
                        {f.walking_time} on foot
                      </p>
                    )}
                  </div>
                  <AirsideBadge airside={f.airside} size="small" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {finds && finds.length > 0 && (
        <div className="mt-8">
          <Link
            href={`/add?destination=${slug}`}
            className="block w-full rounded border-2 border-ink px-4 py-3 text-center font-sans font-bold text-ink no-underline"
          >
            Add a Find at {destination.city}
          </Link>
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { title: `${city} — OM-Eat` };
}
