import { axiosInstance } from "@/lib/axiosInstance";

type ReverseGeocodeResult = {
  city: string | null;
  state: string | null;
  country: string | null;
};

export async function reverseGeocodeCity(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const { data } = await axiosInstance.get("/location/reverse-geocode", {
    params: { lat, lng },
  });

  return {
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
  };
}
