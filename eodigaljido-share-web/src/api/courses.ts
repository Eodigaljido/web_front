import axios from 'axios';
import { apiClient } from './client';
import type { CourseApiResponse, CoursePreview } from '../types/course';
import { formatDuration } from '../utils/formatDuration';

function normalizeCourse(data: CourseApiResponse, courseId: string): CoursePreview {
  const durationLabel =
    data.durationLabel ?? formatDuration(data.overallDurationMinutes);

  return {
    courseId: data.courseId ?? courseId,
    title: data.title ?? '코스',
    region: data.region,
    category: data.category,
    durationLabel,
    thumbnailUrl: data.thumbnailUrl,
    departure: data.departure,
    arrival: data.arrival,
    tags: data.tags,
    saveCount: data.saveCount,
    rating: data.rating,
    steps: data.steps,
  };
}

async function fetchFrom(path: string, courseId: string): Promise<CoursePreview | null> {
  try {
    const { data } = await apiClient.get<CourseApiResponse>(path);
    if (!data?.title && !data?.courseId) return null;
    return normalizeCourse(data, courseId);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchCoursePreview(courseId: string): Promise<CoursePreview | null> {
  const preview = await fetchFrom(`/api/courses/public/${encodeURIComponent(courseId)}/preview`, courseId);
  if (preview) return preview;
  return fetchFrom(`/api/courses/${encodeURIComponent(courseId)}`, courseId);
}
