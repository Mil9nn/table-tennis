import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 },
      );
    }

    const response = await axios.get<BigDataCloudResponse>(
      "https://api.bigdatacloud.net/data/reverse-geocode-client",
      {
        params: {
          latitude: lat,
          longitude: lng,
          localityLanguage: "en",
        },
        timeout: 8000,
      },
    );

    const data = response.data;
    const city = data.city || data.locality || null;

    return NextResponse.json({
      city,
      state: data.principalSubdivision || null,
      country: data.countryName || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Reverse geocoding failed" },
      { status: 502 },
    );
  }
}
