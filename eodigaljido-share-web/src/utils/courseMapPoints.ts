import type { CoursePreview, CourseStep } from '../types/course';
import type { GeoPoint } from './geocode';
import { geocodePlaces } from './geocode';

function stepToPoint(step: CourseStep, index: number): GeoPoint | null {
  const lat = step.lat ?? step.latitude;
  const lng = step.lng ?? step.longitude;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng, label: step.name || `경유 ${index + 1}` };
}

export function extractCoordinatesFromCourse(course: CoursePreview): GeoPoint[] {
  if (course.routePoints?.length) {
    return course.routePoints
      .filter((p) => p.lat != null && p.lng != null)
      .map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        label: p.label ?? p.name ?? `지점 ${i + 1}`,
      }));
  }

  const fromSteps = (course.steps ?? [])
    .map((step, i) => stepToPoint(step, i))
    .filter((p): p is GeoPoint => p != null);

  if (fromSteps.length > 0) return fromSteps;

  return [];
}

export async function resolveCourseMapPoints(course: CoursePreview): Promise<GeoPoint[]> {
  const coords = extractCoordinatesFromCourse(course);
  if (coords.length > 0) return coords;

  const names: string[] = [];
  if (course.departure) names.push(course.departure);
  if (course.steps?.length) {
    for (const step of course.steps.slice(0, 6)) {
      if (step.name && !names.includes(step.name)) names.push(step.name);
    }
  }
  if (course.arrival && !names.includes(course.arrival)) {
    names.push(course.arrival);
  }

  if (names.length === 0) return [];

  return geocodePlaces(names);
}
