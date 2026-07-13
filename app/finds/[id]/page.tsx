import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { AirsideBadge } from "@/app/finds/airside-badge";
import { ConfirmControl } from "@/app/finds/confirm-control";

export const revalidate = 60;

export default async function FindPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: find } = await supabase
    .from("finds")
    .select(
      "id, dish, place, airside, terminal_area, walking_time, cost_amount, cost_currency, payment, opening_hours, directions, maps_url, submitter_display, confirm_count, last_confirmed_at, destinations ( iata, city, country, slug )",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!find) notFound();

  const destination = Array.isArray(find.destinations)
    ? find.destinations[0]
    : find.destinations;

  const paymentLabel =
    find.payment === "cash"
      ? "Cash only"
      : find.payment === "card"
        ? "Card only"
        : find.payment === "both"
          ? "Cash or card"
          : null;

  const cost =
    find.cost_amount != null
      ? `${find.cost_amount} ${find.cost_currency ?? ""}`.trim()
      : null;

  const facts: [string, string | null][] = [
    ["Terminal / area", find.terminal_area],
    ["Walking time", find.walking_time],
    ["Cost", cost],
    ["Payment", paymentLabel],
    ["Opening hours", find.opening_hours],
  ];

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      {destination && (
        <Link
          href={`/destinations/${destination.slug}`}
          className="font-mono text-sm font-bold underline"
        >
          {destination.iata} {destination.city}
        </Link>
      )}

      <h1 className="mt-2 text-2xl font-bold">{find.dish}</h1>
      <p className="text-base">{find.place}</p>

      <div className="mt-4">
        <AirsideBadge airside={find.airside} />
      </div>

      <ConfirmControl
        findId={find.id}
        initialCount={find.confirm_count}
        initialLastConfirmedAt={find.last_confirmed_at}
      />

      <dl className="mt-6 divide-y divide-neutral-300 border-y border-neutral-300">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2">
              <dt className="text-sm font-semibold">{label}</dt>
              <dd className="text-sm text-right">{value}</dd>
            </div>
          ))}
      </dl>

      {find.directions && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Directions
          </h2>
          <p className="mt-2 whitespace-pre-line text-base">
            {find.directions}
          </p>
        </section>
      )}

      {find.maps_url && !find.airside && (
        <p className="mt-4">
          <a
            href={find.maps_url}
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="text-sm font-semibold underline"
          >
            Map link (external)
          </a>
        </p>
      )}

      {find.submitter_display && (
        <p className="mt-6 text-xs text-neutral-600">
          Reported by {find.submitter_display}.
        </p>
      )}

      <div className="mt-8 border-t border-neutral-300 pt-4">
        <Link
          href={`/finds/${find.id}/update`}
          className="text-sm font-semibold underline"
        >
          Update details
        </Link>
        <p className="mt-1 text-xs text-neutral-600">
          Closed down, moved, wrong price? File a correction.
        </p>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: find } = await supabase
    .from("finds")
    .select("dish, place")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return {
    title: find ? `${find.dish}, ${find.place} — OMEat` : "OMEat",
  };
}
