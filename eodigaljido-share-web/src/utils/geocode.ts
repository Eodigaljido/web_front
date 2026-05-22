export type GeoPoint = {
  lat: number;
  lng: number;
  label?: string;
};

type KakaoAddressDocument = {
  x: string;
  y: string;
  place_name?: string;
  address_name?: string;
};

type KakaoKeywordResponse = {
  documents?: KakaoAddressDocument[];
};

export async function geocodePlace(name: string): Promise<GeoPoint | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({ query: trimmed });
  const res = await fetch(`/kakao-api/v2/local/search/keyword.json?${params}`);

  if (!res.ok) return null;

  const data = (await res.json()) as KakaoKeywordResponse;
  const hit = data.documents?.[0];
  if (!hit) return null;

  return {
    lat: Number.parseFloat(hit.y),
    lng: Number.parseFloat(hit.x),
    label: hit.place_name ?? hit.address_name ?? trimmed,
  };
}

export async function geocodePlaces(names: string[]): Promise<GeoPoint[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const points: GeoPoint[] = [];

  for (const name of unique) {
    const point = await geocodePlace(name);
    if (point) points.push(point);
    if (unique.indexOf(name) < unique.length - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return points;
}
