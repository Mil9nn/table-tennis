export const venueTypes = ["stadium", "gym", "school", "university", "park"] as const;

export const venueKeywords = [
  "sports complex",
  "tournament",
  "court",
  "table tennis",
  "indoor stadium",
  "sports academy",
] as const;

export function buildVenueSearchPhrases(city: string, query: string): string[] {
  const cleanCity = city.trim();
  const cleanQuery = query.trim();

  if (!cleanCity) return [];

  const phrases: string[] = [];

  if (cleanQuery) {
    phrases.push(`${cleanQuery}, ${cleanCity}, India`);
    for (const type of venueTypes) {
      phrases.push(`${cleanQuery} ${type}, ${cleanCity}, India`);
    }
  } else {
    for (const keyword of venueKeywords) {
      phrases.push(`${keyword}, ${cleanCity}, India`);
    }
    for (const type of venueTypes) {
      phrases.push(`${type}, ${cleanCity}, India`);
    }
  }

  return Array.from(new Set(phrases)).slice(0, 6);
}
