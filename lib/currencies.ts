// Currency per destination country. The destination fixes the country and
// the country fixes the currency, so submitters never pick one — it is
// derived at display time. Keyed by the country name stored in
// destinations.country; update alongside the destinations seed.

const COUNTRY_SYMBOLS: Record<string, string> = {
  Portugal: "€",
  Spain: "€",
  France: "€",
  Switzerland: "CHF ",
  Austria: "€",
  Italy: "€",
  Croatia: "€",
  Malta: "€",
  Cyprus: "€",
  Greece: "€",
  Turkey: "₺",
  Morocco: "MAD ",
  Algeria: "DZD ",
  Egypt: "E£",
  Finland: "€",
  Jersey: "£",
};

// Price is a number and cost_qty says how many items it buys, so the symbol
// placement is never ambiguous: qty 1 -> "€11.50", qty 6 -> "€11.50 for 6".
// Unknown country: the bare number is shown rather than a wrong symbol.
export function formatCost(
  amount: number | string,
  qty: number | null,
  country: string | null | undefined,
): string {
  const n = Number(amount);
  const price = Number.isFinite(n)
    ? n.toFixed(2).replace(/\.00$/, "")
    : String(amount);
  const symbol = country ? (COUNTRY_SYMBOLS[country] ?? "") : "";
  const priced = `${symbol}${price}`;
  return qty != null && qty > 1 ? `${priced} for ${qty}` : priced;
}
