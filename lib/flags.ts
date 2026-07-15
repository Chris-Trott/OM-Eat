// Flag emoji for the countries on the network. Keyed by the country name
// stored in destinations.country; update alongside the destinations seed.

const FLAGS: Record<string, string> = {
  Portugal: "🇵🇹",
  Spain: "🇪🇸",
  France: "🇫🇷",
  Switzerland: "🇨🇭",
  Austria: "🇦🇹",
  Italy: "🇮🇹",
  Croatia: "🇭🇷",
  Malta: "🇲🇹",
  Cyprus: "🇨🇾",
  Greece: "🇬🇷",
  Turkey: "🇹🇷",
  Morocco: "🇲🇦",
  Algeria: "🇩🇿",
  Egypt: "🇪🇬",
  Finland: "🇫🇮",
  Jersey: "🇯🇪",
};

export function countryFlag(country: string): string {
  return FLAGS[country] ?? "";
}
