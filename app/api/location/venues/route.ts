import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import {
  buildVenueSearchPhrases,
  venueKeywords,
  venueTypes,
} from "@/lib/location/venueSearchConfig";

type NominatimPlace = {
  display_name?: string;
  name?: string;
  class?: string;
  type?: string;
  importance?: number;
};

function normalizeVenueName(place: NominatimPlace): string | null {
  const primary = (place.name || "").trim();
  if (primary) return primary;

  const display = (place.display_name || "").trim();
  if (!display) return null;
  return display.split(",")[0]?.trim() || null;
}

function scorePlace(place: NominatimPlace, query: string): number {
  const label = `${place.name || ""} ${place.display_name || ""}`.toLowerCase();
  const cleanQuery = query.trim().toLowerCase();
  const placeType = (place.type || "").toLowerCase();
  const placeClass = (place.class || "").toLowerCase();

  let score = Number(place.importance || 0);

  if (cleanQuery) {
    if (label.startsWith(cleanQuery)) score += 8;
    else if (label.includes(cleanQuery)) score += 5;
  }

  if (venueTypes.some((type) => placeType.includes(type))) {
    score += 3;
  }

  if (venueKeywords.some((keyword) => label.includes(keyword))) {
    score += 2;
  }

  if (placeClass === "leisure" || placeClass === "amenity" || placeClass === "building") {
    score += 1;
  }

  return score;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = (searchParams.get("city") || "").trim();
    const query = (searchParams.get("query") || "").trim();

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    const searchPhrases = buildVenueSearchPhrases(city, query);
    if (searchPhrases.length === 0) {
      return NextResponse.json({ venues: [] });
    }

    const searchResults = await Promise.all(
      searchPhrases.map((searchText) =>
        axios.get<NominatimPlace[]>("https://nominatim.openstreetmap.org/search", {
          params: {
            q: searchText,
            format: "jsonv2",
            limit: 10,
            addressdetails: 1,
            countrycodes: "in",
          },
          headers: {
            "User-Agent": "table-tennis-app/1.0 (venue-search)",
            Referer: "http://localhost:3000",
          },
          timeout: 10000,
        }),
      ),
    );

    const allPlaces = searchResults.flatMap((result) => result.data);
    const scoredMap = new Map<string, number>();

    for (const place of allPlaces) {
      const venueName = normalizeVenueName(place);
      if (!venueName || venueName.length < 2) continue;
      const score = scorePlace(place, query);
      const current = scoredMap.get(venueName) || Number.NEGATIVE_INFINITY;
      if (score > current) {
        scoredMap.set(venueName, score);
      }
    }

    const ranked = Array.from(scoredMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 8);

    return NextResponse.json({ venues: ranked });
  } catch {
    return NextResponse.json({ venues: [] }, { status: 200 });
  }
}
