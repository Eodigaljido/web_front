import type { CoursePreview, CourseStep } from '../types/course';
import type { GeoPoint } from './geocode';
import { geocodePlace } from './geocode';

const MAX_STOPS = 20;
const GEOCODE_DELAY_MS = 120;

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

async function delay(ms: number): Promise<void> {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

async function pointFromName(name: string, label: string): Promise<GeoPoint | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const hit = await geocodePlace(trimmed);
  if (!hit) return null;
  return { ...hit, label };
}

/** 백엔드 routeSteps(좌표 포함) → 지도 행선지 */
function stopsFromSteps(steps: CourseStep[]): GeoPoint[] {
  const stops: GeoPoint[] = [];
  for (let i = 0; i < steps.length; i++) {
    const p = stepToPoint(steps[i], i);
    if (!p) continue;
    const name = steps[i].name || p.label || `경유 ${i + 1}`;
    const label =
      i === 0 ? `출발 ${name}` : i === steps.length - 1 ? `도착 ${name}` : name;
    pushStop(stops, { ...p, label });
  }
  return stops;
}

/** 출발 → steps(경유) → 도착 (이름 지오코딩 fallback) */
async function stopsFromNames(course: CoursePreview): Promise<GeoPoint[]> {
  const stops: GeoPoint[] = [];
  let geocodeCount = 0;

  if (course.departure) {
    await delay(geocodeCount++ * GEOCODE_DELAY_MS);
    const p = await pointFromName(course.departure, `출발 ${course.departure}`);
    if (p) pushStop(stops, p);
  }

  for (const step of course.steps ?? []) {
    if (stops.length >= MAX_STOPS) break;
    const fromCoord = stepToPoint(step, stops.length);
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
    await delay(geocodeCount * GEOCODE_DELAY_MS);
    const p = await pointFromName(course.arrival, `도착 ${course.arrival}`);
    if (p) pushStop(stops, p);
  }

  return stops;
}

/** 출발 → 경유(routeSteps) → 도착 순서의 행선지 */
export async function resolveCourseMapPoints(course: CoursePreview): Promise<GeoPoint[]> {
  const steps = course.steps ?? [];

  // 1) 백엔드 routeSteps에 좌표가 있으면 그 순서 그대로 사용 (경유지 포함)
  const fromSteps = stopsFromSteps(steps);
  if (fromSteps.length >= 2) return fromSteps;

  // 2) 이름으로 출발·경유·도착 지오코딩
  const fromNames = await stopsFromNames(course);
  if (fromNames.length >= 2) return fromNames;

  return fromSteps.length > 0 ? fromSteps : fromNames;
}
