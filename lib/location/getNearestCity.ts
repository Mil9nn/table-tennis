import { cityList, type CityItem } from "@/lib/cities/city-list";

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getNearestCity(
  userPoint: { lat: number; lng: number },
): CityItem | null {
  let nearestCity: CityItem | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const city of cityList) {
    const distance = getDistanceKm(userPoint, city);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}
