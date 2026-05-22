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

/** 카카오 길찾기 waypoints 최대 5개 (출발·도착 제외) */
const MAX_WAYPOINTS_PER_REQUEST = 5;

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

async function fetchDrivingRouteSegment(stops: GeoPoint[]): Promise<GeoPoint[] | null> {
  if (stops.length < 2) return stops;

  const params = new URLSearchParams({
    origin: toCoord(stops[0]),
    destination: toCoord(stops[stops.length - 1]),
    priority: 'RECOMMEND',
  });

  const middle = stops.slice(1, -1).slice(0, MAX_WAYPOINTS_PER_REQUEST);
  if (middle.length > 0) {
    params.set('waypoints', middle.map(toCoord).join('|'));
  }

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
  if (last.lat === first.lat && last.lng === first.lng) {
    merged.push(...segment.slice(1));
  } else {
    merged.push(...segment);
  }
}

/** 출발·경유·도착 순서대로 도로 경로 (경유 5개 초과 시 구간 나눠 이어 붙임) */
export async function fetchDrivingRoutePath(stops: GeoPoint[]): Promise<GeoPoint[] | null> {
  if (stops.length < 2) return stops;

  const maxStopsPerLeg = MAX_WAYPOINTS_PER_REQUEST + 2;
  if (stops.length <= maxStopsPerLeg) {
    return fetchDrivingRouteSegment(stops);
  }

  const merged: GeoPoint[] = [];
  let start = 0;

  while (start < stops.length - 1) {
    const end = Math.min(start + maxStopsPerLeg - 1, stops.length - 1);
    const leg = stops.slice(start, end + 1);
    const segment = await fetchDrivingRouteSegment(leg);
    if (!segment) return merged.length >= 2 ? merged : null;
    appendPath(merged, segment);
    if (end >= stops.length - 1) break;
    start = end;
  }

  return merged.length >= 2 ? merged : null;
}
