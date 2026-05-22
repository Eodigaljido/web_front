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

function isKoreaBounds(p: GeoPoint): boolean {
  return p.lat >= 33 && p.lat <= 39.8 && p.lng >= 124 && p.lng <= 132.5;
}

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
        const a = { lng: vertexes[i], lat: vertexes[i + 1] };
        const b = { lng: vertexes[i + 1], lat: vertexes[i] };
        path.push(isKoreaBounds(a) ? a : isKoreaBounds(b) ? b : a);
      }
    }
  }
  return path;
}

async function fetchDrivingRouteSegment(stops: GeoPoint[]): Promise<GeoPoint[] | null> {
  if (stops.length < 2) return stops;

  const params = new URLSearchParams({
    origin: toCoord(stops[0]),
    destination: toCoord(stops[stops.length - 1]),
    priority: 'RECOMMEND',
  });

  const res = await fetch(`/kakao-navi/v1/directions?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as KakaoDirectionsResponse;
  const path = parseVertexes(data);
  return path.length >= 2 ? path : null;
}

function appendPath(merged: GeoPoint[], segment: GeoPoint[]): void {
  if (segment.length === 0) return;
  if (merged.length === 0) {
    merged.push(...segment);
    return;
  }
  const last = merged[merged.length - 1];
  const first = segment[0];
  if (Math.abs(last.lat - first.lat) < 1e-5 && Math.abs(last.lng - first.lng) < 1e-5) {
    merged.push(...segment.slice(1));
  } else {
    merged.push(...segment);
  }
}

/**
 * 행선지마다 이어 붙인 도로 경로 (마커와 선이 어긋나지 않도록 구간별 길찾기)
 */
export async function fetchDrivingRoutePath(stops: GeoPoint[]): Promise<GeoPoint[] | null> {
  if (stops.length < 2) return stops;

  const merged: GeoPoint[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const segment = await fetchDrivingRouteSegment([stops[i], stops[i + 1]]);
    if (!segment) continue;
    appendPath(merged, segment);
  }

  return merged.length >= 2 ? merged : null;
}
