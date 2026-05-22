import type { CourseApiResponse, CoursePreview, CourseStep } from '../types/course';
import { formatDuration } from '../utils/formatDuration';

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number.parseFloat(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function normalizeStep(raw: unknown, index: number): CourseStep | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name } : null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const o = raw as Record<string, unknown>;
  const name =
    pickString(o, ['name', 'placeName', 'place_name', 'title', 'locationName', 'spotName']) ??
    `경유 ${index + 1}`;

  const lat = pickNumber(o, ['lat', 'latitude', 'y']);
  const lng = pickNumber(o, ['lng', 'longitude', 'x']);
  const durationMinutes = pickNumber(o, ['durationMinutes', 'stayMinutes', 'stay_minutes']);

  return {
    name,
    ...(lat != null ? { lat } : {}),
    ...(lng != null ? { lng } : {}),
    ...(durationMinutes != null ? { durationMinutes } : {}),
  };
}

/** 백엔드 routeSteps / steps 등 다양한 필드명 → steps */
export function normalizeSteps(data: CourseApiResponse): CourseStep[] | undefined {
  const raw =
    data.steps ??
    data.routeSteps ??
    (data as Record<string, unknown>).route_steps;

  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  return raw
    .map((item, i) => normalizeStep(item, i))
    .filter((s): s is CourseStep => s != null);
}

export function normalizeCourse(data: CourseApiResponse, courseId: string): CoursePreview {
  const durationLabel =
    data.durationLabel ?? formatDuration(data.overallDurationMinutes);

  const steps = normalizeSteps(data);

  return {
    courseId: data.courseId ?? (data as Record<string, unknown>).id?.toString() ?? courseId,
    title: data.title ?? '코스',
    region: data.region ?? undefined,
    category: data.category ?? undefined,
    durationLabel,
    thumbnailUrl: data.thumbnailUrl ?? data.thumbnail ?? null,
    departure: data.departure,
    arrival: data.arrival,
    tags: data.tags,
    saveCount: data.saveCount ?? (data as Record<string, unknown>).views as number | undefined,
    rating: data.rating,
    steps,
    routePoints: data.routePoints ?? data.mapPoints,
  };
}

/** preview(메타) + detail(routeSteps) 병합 */
export function mergeCoursePreview(
  preview: CoursePreview,
  detail: CoursePreview,
): CoursePreview {
  return {
    ...preview,
    steps: detail.steps?.length ? detail.steps : preview.steps,
    routePoints: detail.routePoints?.length ? detail.routePoints : preview.routePoints,
    departure: preview.departure ?? detail.departure,
    arrival: preview.arrival ?? detail.arrival,
    thumbnailUrl: preview.thumbnailUrl ?? detail.thumbnailUrl,
    saveCount: preview.saveCount ?? detail.saveCount,
    rating: preview.rating ?? detail.rating,
    tags: preview.tags?.length ? preview.tags : detail.tags,
  };
}
