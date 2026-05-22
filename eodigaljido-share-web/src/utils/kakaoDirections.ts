import type { GeoPoint } from './geocode';

type KakaoDirectionsResponse = {
  routes?: {
    sections?: {
      roads?: {
        vertexes?: number[];
      }[];
    }[];
  }[];
};

function toCoord(p: GeoPoint): string {
  return `${p.lng},${p.lat}`;
}

function parseVertexes(data: KakaoDirectionsResponse): GeoPoint[] {
  const route = data.routes?.[0];
  if (!route?.sections) return [];

  const path: GeoPoint[] = [];
  for (const section of route.sections) {
    for (const road of section.roads ?? []) {
      const vertexes = road.vertexes ?? [];
      for (let i = 0; i < vertexes.length - 1; i += 2) {
        path.push({ lng: vertexes[i], lat: vertexes[i + 1] });
      }
    }
  }
  return path;
}

/** 카카오 길찾기(자동차) — 행선지 순서대로 도로 경로 좌표 반환 */
export async function fetchDrivingRoutePath(stops: GeoPoint[]): Promise<GeoPoint[] | null> {
  if (stops.length < 2) return stops;

  const params = new URLSearchParams({
    origin: toCoord(stops[0]),
    destination: toCoord(stops[stops.length - 1]),
    priority: 'RECOMMEND',
  });

  const middle = stops.slice(1, -1);
  if (middle.length > 0) {
    params.set('waypoints', middle.map(toCoord).join('|'));
  }

  const res = await fetch(`/kakao-navi/v1/directions?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as KakaoDirectionsResponse;
  const path = parseVertexes(data);
  return path.length >= 2 ? path : null;
}
