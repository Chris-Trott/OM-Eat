// The single most important signal on the site: can this Find be reached
// without leaving the terminal? Rendered loud on the Find page, compact in
// lists. Muted green = airside; amber/brown = landside.

export function AirsideBadge({
  airside,
  size = "large",
}: {
  airside: boolean;
  size?: "large" | "small";
}) {
  const label = airside ? "AIRSIDE" : "LANDSIDE";
  const colours = airside
    ? "bg-airside-bg text-airside-fg"
    : "bg-landside-bg text-landside-fg";

  if (size === "small") {
    return (
      <span
        className={`shrink-0 rounded px-2 py-1 font-sans text-xs font-bold tracking-wide ${colours}`}
      >
        {label}
      </span>
    );
  }

  return (
    <div className={`rounded px-5 py-4 text-center ${colours}`}>
      <p className="font-sans text-2xl font-bold tracking-[0.18em] leading-tight">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm font-medium">
        {airside
          ? "Past security. No re-screening required."
          : "Outside the terminal. Allow time to re-clear security."}
      </p>
    </div>
  );
}
