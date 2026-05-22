import type { CoursePreview, CourseStep } from '../types/course';
import type { GeoPoint } from './geocode';
import { geocodePlace } from './geocode';

const MAX_STOPS = 20;

function stepToPoint(step: CourseStep, index: number): GeoPoint | null {
  const lat = step.lat ?? step.latitude;
  const lng = step.lng ?? step.longitude;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng, label: step.name || `경유 ${index + 1}` };
}

function samePlace(a: GeoPoint, b: GeoPoint): boolean {
  return Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5;
}

function pushStop(points: GeoPoint[], point: GeoPoint): void {
  const last = points[points.length - 1];
  if (last && samePlace(last, point)) return;
  points.push(point);
}

/** routePoints가 도로 좌표 뭉치인지(경유 마커용이 아님) */
function isDenseRoutePolyline(routePoints: CoursePreview['routePoints']): boolean {
  if (!routePoints?.length) return false;
  if (routePoints.length > 12) return true;
  const labeled = routePoints.filter((p) => p.label || p.name).length;
  return labeled < routePoints.length / 2;
}

const GEOCODE_DELAY_MS = 120;

async function pointFromName(name: string, label: string): Promise<GeoPoint | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const hit = await geocodePlace(trimmed);
  if (!hit) return null;
  return { ...hit, label };
}

async function delay(ms: number): Promise<void> {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

/** 출발 → steps(경유) → 도착 순서의 행선지(지도 마커·길찾기 경유) */
export async function resolveCourseMapPoints(course: CoursePreview): Promise<GeoPoint[]> {
  const stops: GeoPoint[] = [];

  let geocodeCount = 0;

  if (course.departure) {
    await delay(geocodeCount++ * GEOCODE_DELAY_MS);
    const p = await pointFromName(course.departure, `출발 ${course.departure}`);
    if (p) pushStop(stops, p);
  }

  const steps = course.steps ?? [];
  for (let i = 0; i < steps.length && stops.length < MAX_STOPS; i++) {
    const step = steps[i];
    const fromCoord = stepToPoint(step, i);
    if (fromCoord) {
      pushStop(stops, fromCoord);
      continue;
    }
    if (step.name) {
      await delay(geocodeCount++ * GEOCODE_DELAY_MS);
      const p = await pointFromName(step.name, step.name);
      if (p) pushStop(stops, p);
    }
  }

  if (course.arrival && stops.length < MAX_STOPS) {
    await delay(geocodeCount++ * GEOCODE_DELAY_MS);
    const p = await pointFromName(course.arrival, `도착 ${course.arrival}`);
    if (p) pushStop(stops, p);
  }

  if (stops.length >= 2) return stops;

  // 출발/도착 필드 없이 steps 좌표만 있는 경우
  const fromSteps = steps
    .map((step, i) => stepToPoint(step, i))
    .filter((p): p is GeoPoint => p != null);
  if (fromSteps.length >= 2) return fromSteps;

  // routePoints가 소수의 명시 지점일 때만 fallback
  if (course.routePoints?.length && !isDenseRoutePolyline(course.routePoints)) {
    return course.routePoints
      .filter((p) => p.lat != null && p.lng != null)
      .map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        label: p.label ?? p.name ?? `지점 ${i + 1}`,
      }));
  }

  return stops;
}
