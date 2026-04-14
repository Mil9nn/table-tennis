import { axiosInstance } from "@/lib/axiosInstance";

export async function searchVenuesByCity(
  city: string,
  query: string,
): Promise<string[]> {
  const { data } = await axiosInstance.get("/location/venues", {
    params: { city, query },
  });

  return Array.isArray(data?.venues) ? data.venues : [];
}
