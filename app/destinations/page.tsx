import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { countryFlag } from "@/lib/flags";

export const revalidate = 3600;

export const metadata = {
  title: "Destinations — OM-Eat",
};

type Destination = {
  id: string;
  iata: string;
  city: string;
  country: string;
  slug: string;
};

export default async function DestinationsPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("destinations")
    .select("id, iata, city, country, slug")
    .order("country")
    .order("city");

  const destinations = (data ?? []) as Destination[];

  const byCountry = new Map<string, Destination[]>();
  for (const d of destinations) {
    const group = byCountry.get(d.country) ?? [];
    group.push(d);
    byCountry.set(d.country, group);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">Destinations</h1>
      <p className="mt-2 text-sm text-secondary">
        Network coverage as operated from London Gatwick. Select a
        destination for its entries.
      </p>

      {[...byCountry.entries()].map(([country, group]) => (
        <section key={country} className="mt-8">
          <h2 className="border-b-2 border-ink pb-1 text-sm font-bold uppercase tracking-widest">
            <span aria-hidden="true">{countryFlag(country)}</span> {country}
          </h2>
          <ul>
            {group.map((d) => (
              <li key={d.id} className="border-b border-line">
                <Link
                  href={`/destinations/${d.slug}`}
                  className="flex items-baseline gap-3 py-3 text-ink no-underline"
                >
                  <span className="w-12 shrink-0 font-mono text-sm font-bold">
                    {d.iata}
                  </span>
                  <span className="text-base">{d.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
