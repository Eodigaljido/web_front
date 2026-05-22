import axios from 'axios';
import { apiClient } from './client';
import { mergeCoursePreview, normalizeCourse } from './courseNormalize';
import type { CourseApiResponse, CoursePreview } from '../types/course';

async function fetchFrom(path: string, courseId: string): Promise<CoursePreview | null> {
  try {
    const { data } = await apiClient.get<CourseApiResponse>(path);
    if (!data?.title && !data?.courseId && !(data as Record<string, unknown>).id) {
      return null;
    }
    return normalizeCourse(data, courseId);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchCoursePreview(courseId: string): Promise<CoursePreview | null> {
  const encoded = encodeURIComponent(courseId);
  const previewPath = `/api/courses/public/${encoded}/preview`;
  const detailPath = `/api/courses/${encoded}`;

  const [preview, detail] = await Promise.all([
    fetchFrom(previewPath, courseId),
    fetchFrom(detailPath, courseId),
  ]);

  if (!preview && !detail) return null;
  if (!preview) return detail;
  if (!detail) return preview;

  return mergeCoursePreview(preview, detail);
}
