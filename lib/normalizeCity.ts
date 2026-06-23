/** Trim and title-case a city name for consistent storage and display. */
export function normalizeCityName(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Key for grouping cities (case- and whitespace-insensitive). */
export function cityGroupingKey(city: string): string {
  return city.trim().toLowerCase();
}
