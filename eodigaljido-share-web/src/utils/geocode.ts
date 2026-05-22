export type GeoPoint = {
  lat: number;
  lng: number;
  label?: string;
};

const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'ko',
  'User-Agent': 'EodigaljidoShareWeb/1.0 (https://share.eodigaljido.rjsgud.com)',
};

export async function geocodePlace(name: string): Promise<GeoPoint | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const query = trimmed.includes('대한민국') ? trimmed : `${trimmed}, 대한민국`;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
  });

  // 브라우저 CORS 회피: Nginx/Vite가 /geocode → nominatim 프록시
  const res = await fetch(`/geocode/search?${params}`, {
    headers: NOMINATIM_HEADERS,
  });

  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string }[];
  const hit = results[0];
  if (!hit) return null;

  return {
    lat: Number.parseFloat(hit.lat),
    lng: Number.parseFloat(hit.lon),
    label: trimmed,
  };
}

/** Nominatim 정책: 연속 요청 시 간격 */
export async function geocodePlaces(names: string[]): Promise<GeoPoint[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const points: GeoPoint[] = [];

  for (const name of unique) {
    const point = await geocodePlace(name);
    if (point) points.push(point);
    if (unique.indexOf(name) < unique.length - 1) {
      await new Promise((r) => setTimeout(r, 1100));
    }
  }

  return points;
}
