import Link from "next/link";

export const metadata = {
  title: "OM-Eat — Ops Manual E(at)",
  description:
    "Reference guide to what to eat on a turnaround, maintained by BA Euroflyer crew at London Gatwick.",
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">OM-Eat</h1>
      <p className="mt-1 font-mono text-sm font-semibold uppercase tracking-wide text-secondary">
        Ops Manual E(at) — Gatwick short-haul edition
      </p>

      <div className="mt-8">
        <Link
          href="/destinations"
          className="block w-full rounded border-2 border-ink bg-ink px-4 py-4 text-center font-sans text-lg font-bold text-page no-underline"
        >
          Destinations
        </Link>
      </div>

      <section className="mt-8 space-y-4 text-base">
        <p>
          This manual records what to eat at each destination during a
          turnaround, as reported by operating crew. Each entry is one
          specific item, at one specific place, at one destination, with
          directions and timings suitable for a crew member on limited
          ground time.
        </p>
        <p>
          Entries are classified <strong>airside</strong> or{" "}
          <strong>landside</strong>. Check the classification before setting
          out; the manual accepts no responsibility for missed departures.
        </p>
        <p>
          All entries are reviewed by a curator before publication and
          re-confirmed by crew over time. Where information is found to be
          out of date, file a correction from the entry concerned.
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/add"
          className="block w-full rounded border-2 border-ink px-4 py-4 text-center font-sans text-lg font-bold text-ink no-underline"
        >
          Add a Find
        </Link>
      </div>

      <p className="mt-10 text-xs text-muted">
        Revision status: continuous. Distribution: unrestricted.
      </p>
    </main>
  );
}
