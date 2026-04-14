export type CityItem = {
  name: string;
  lat: number;
  lng: number;
};

export type StateItem = {
  name: string;
  type: "state" | "union_territory";
  cities: CityItem[];
};

export const states: StateItem[] = [
  { name: "Andhra Pradesh", type: "state", cities: [{ name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 }] },
  { name: "Arunachal Pradesh", type: "state", cities: [] },
  { name: "Assam", type: "state", cities: [{ name: "Guwahati", lat: 26.1445, lng: 91.7362 }] },
  { name: "Bihar", type: "state", cities: [{ name: "Patna", lat: 25.5941, lng: 85.1376 }] },
  { name: "Chhattisgarh", type: "state", cities: [] },
  { name: "Goa", type: "state", cities: [] },
  { name: "Gujarat", type: "state", cities: [{ name: "Ahmedabad", lat: 23.0225, lng: 72.5714 }, { name: "Surat", lat: 21.1702, lng: 72.8311 }] },
  { name: "Haryana", type: "state", cities: [{ name: "Gurugram", lat: 28.4595, lng: 77.0266 }] },
  { name: "Himachal Pradesh", type: "state", cities: [] },
  { name: "Jharkhand", type: "state", cities: [] },
  { name: "Karnataka", type: "state", cities: [{ name: "Bengaluru", lat: 12.9716, lng: 77.5946 }] },
  { name: "Kerala", type: "state", cities: [{ name: "Kochi", lat: 9.9312, lng: 76.2673 }, { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 }] },
  { name: "Madhya Pradesh", type: "state", cities: [{ name: "Indore", lat: 22.7196, lng: 75.8577 }, { name: "Bhopal", lat: 23.2599, lng: 77.4126 }] },
  { name: "Maharashtra", type: "state", cities: [{ name: "Mumbai", lat: 19.076, lng: 72.8777 }, { name: "Pune", lat: 18.5204, lng: 73.8567 }, { name: "Nagpur", lat: 21.1458, lng: 79.0882 }] },
  { name: "Manipur", type: "state", cities: [] },
  { name: "Meghalaya", type: "state", cities: [] },
  { name: "Mizoram", type: "state", cities: [] },
  { name: "Nagaland", type: "state", cities: [] },
  { name: "Odisha", type: "state", cities: [{ name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 }] },
  { name: "Punjab", type: "state", cities: [] },
  { name: "Rajasthan", type: "state", cities: [{ name: "Jaipur", lat: 26.9124, lng: 75.7873 }] },
  { name: "Sikkim", type: "state", cities: [] },
  { name: "Tamil Nadu", type: "state", cities: [{ name: "Chennai", lat: 13.0827, lng: 80.2707 }, { name: "Coimbatore", lat: 11.0168, lng: 76.9558 }] },
  { name: "Telangana", type: "state", cities: [{ name: "Hyderabad", lat: 17.385, lng: 78.4867 }] },
  { name: "Tripura", type: "state", cities: [] },
  { name: "Uttar Pradesh", type: "state", cities: [{ name: "Lucknow", lat: 26.8467, lng: 80.9462 }, { name: "Noida", lat: 28.5355, lng: 77.391 }, { name: "Kanpur", lat: 26.4499, lng: 80.3319 }] },
  { name: "Uttarakhand", type: "state", cities: [] },
  { name: "West Bengal", type: "state", cities: [{ name: "Kolkata", lat: 22.5726, lng: 88.3639 }] },
]

export const unionTerritories: StateItem[] = [
  { name: "Andaman and Nicobar Islands", type: "union_territory", cities: [] },
  { name: "Chandigarh", type: "union_territory", cities: [{ name: "Chandigarh", lat: 30.7333, lng: 76.7794 }] },
  { name: "Dadra and Nagar Haveli and Daman and Diu", type: "union_territory", cities: [] },
  { name: "Delhi", type: "union_territory", cities: [{ name: "Delhi", lat: 28.6139, lng: 77.209 }] },
  {
    name: "Jammu and Kashmir",
    type: "union_territory",
    cities: [
      { name: "Jammu", lat: 32.7266, lng: 74.857 },
      { name: "Srinagar", lat: 34.0837, lng: 74.7973 },
    ],
  },
  { name: "Ladakh", type: "union_territory", cities: [] },
  { name: "Lakshadweep", type: "union_territory", cities: [] },
  { name: "Puducherry", type: "union_territory", cities: [] },
];

const allRegions = [...states, ...unionTerritories];

export const cityList: CityItem[] = Array.from(
  new Map(
    allRegions
      .flatMap((region) => region.cities)
      .map((city) => [city.name.toLowerCase(), city]),
  ).values(),
);

export function searchCities(query: string, limit = 8): CityItem[] {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return cityList.slice(0, limit);
  }

  return cityList
    .filter((city) => city.name.toLowerCase().includes(cleanQuery))
    .slice(0, limit);
}
